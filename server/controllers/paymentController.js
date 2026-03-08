const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { Payment, PaymentTransaction, Appointment, sequelize } = require('../models');
const { getHoursUntil } = require('../utils/timezone');

// @desc    Create Payment Intent
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
    const { doctorId, date, timeSlot } = req.body; // SECURITY: No amount from client

    try {
        const { Doctor, Patient, User } = require('../models');
        const { Op } = require('sequelize');

        // 1. Verify doctor exists and get fee
        const doctor = await Doctor.findByPk(doctorId, {
            include: [{ model: User, attributes: ['name', 'email'] }]
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // 2. Get patient profile
        const patient = await Patient.findOne({
            where: { user_id: req.user.id },
            include: [{ model: User, attributes: ['name', 'email'] }]
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        // 3. Check slot availability (prevent double booking)
        const existingAppointment = await Appointment.findOne({
            where: {
                doctor_id: doctorId,
                date: date,
                time_slot: timeSlot,
                status: { [Op.ne]: 'cancelled' }
            }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'Slot no longer available' });
        }

        // 4. Calculate amount on server (SECURITY FIX)
        const consultationFee = parseFloat(doctor.consultation_fee) || 2000;
        const platformFee = 50; // Fixed platform fee
        const totalAmountPKR = consultationFee + platformFee;

        // 5. Convert PKR to USD for Stripe (Stripe doesn't support PKR)
        // Using approximate exchange rate: 1 USD = 280 PKR (adjust as needed)
        const EXCHANGE_RATE = 280;
        const totalAmountUSD = totalAmountPKR / EXCHANGE_RATE;

        console.log(`[STRIPE PAYMENT INTENT INITIATING] Patient: ${patient.id}, Doctor: ${doctor.id}, PKR: ${totalAmountPKR}, USD: ${totalAmountUSD}`);

        // 6. Create PaymentIntent with comprehensive metadata
        // Note: Stripe doesn't support PKR, so we convert to USD for processing
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmountUSD * 100), // Convert to cents (for USD)
            currency: 'usd', // Stripe doesn't support PKR, using USD
            metadata: {
                doctorId: doctorId,
                doctorName: doctor.User.name,
                patientId: patient.id,
                patientName: patient.User.name,
                patientUserId: req.user.id,
                date: date,
                timeSlot: timeSlot,
                consultationFee: consultationFee.toString(),
                platformFee: platformFee.toString()
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: totalAmountPKR, // Send for display only (in PKR)
            amountUSD: totalAmountUSD, // USD amount for reference
            consultationFee,
            platformFee,
            currency: 'pkr', // Display currency
            exchangeRate: EXCHANGE_RATE,
            note: `Amount: PKR ${totalAmountPKR} (≈ $${totalAmountUSD.toFixed(2)} USD)`
        });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record Payment Success
// @route   POST /api/payments/confirm
// @access  Private
const confirmPayment = async (req, res) => {
    const { paymentIntentId, appointmentId, method, amountPKR } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Store amount in PKR safely. Prevent NaN from crashing the DB.
            let amountToStore = amountPKR;
            if (!amountToStore) {
                if (paymentIntent.metadata && paymentIntent.metadata.consultationFee) {
                    amountToStore = parseFloat(paymentIntent.metadata.consultationFee) + parseFloat(paymentIntent.metadata.platformFee || 50);
                } else {
                    amountToStore = (paymentIntent.amount / 100) * 280; // Fallback conversion
                }
            }
            if (!amountToStore || isNaN(amountToStore)) amountToStore = 2050; // Ultimate fallback


            // Use a Sequelize transaction to ensure both records are created atomically
            await sequelize.transaction(async (t) => {
                const payment = await Payment.create({
                    appointment_id: appointmentId,
                    amount: amountToStore,
                    payment_method: method || 'card',
                    status: 'succeeded',
                    transaction_id: paymentIntentId
                }, { transaction: t });

                // Also create a PaymentTransaction record for detailed audit trail
                await PaymentTransaction.create({
                    appointment_id: appointmentId,
                    stripe_payment_intent_id: paymentIntentId,
                    amount_paid: amountToStore,
                    currency: 'usd',
                    refund_status: 'none',
                    payment_method_details: {
                        type: method || 'card',
                        amountPKR: amountToStore,
                        amountUSD: paymentIntent.amount / 100
                    }
                }, { transaction: t });

                // Update Appointment Status atomically
                await Appointment.update(
                    { status: 'confirmed' },
                    { where: { id: appointmentId }, transaction: t }
                );
            });

            res.json({ success: true });
        } else {
            res.status(400).json({ message: 'Payment not successful' });
        }
    } catch (error) {
        console.error("Payment Confirmation Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Stripe Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log(`[WEBHOOK] PaymentIntent succeeded: ${paymentIntent.id}`);

                // Update payment record
                await Payment.update(
                    {
                        status: 'succeeded',
                        payment_intent_id: paymentIntent.id
                    },
                    { where: { transaction_id: paymentIntent.id } }
                );
                break;

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object;
                console.log(`[WEBHOOK] PaymentIntent failed: ${failedIntent.id}`);

                await Payment.update(
                    { status: 'failed' },
                    { where: { transaction_id: failedIntent.id } }
                );
                break;

            case 'charge.refunded':
                const refund = event.data.object;
                console.log(`[WEBHOOK] Charge refunded: ${refund.id}`);

                await Payment.update(
                    {
                        status: 'refunded',
                        refund_id: refund.refunds.data[0].id
                    },
                    { where: { transaction_id: refund.payment_intent } }
                );
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

// @desc    Process Refund
// @route   POST /api/payments/:id/refund
// @access  Private (Admin/System)
const processRefund = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const payment = await Payment.findByPk(id, {
            include: [{ model: Appointment }]
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (payment.status === 'refunded') {
            return res.status(400).json({ message: 'Payment already refunded' });
        }

        // Calculate refund amount based on cancellation policy
        const appointment = payment.Appointment;
        const timezone = appointment.Doctor?.timezone || 'Asia/Karachi';
        const hoursUntilAppointment = getHoursUntil(appointment.date, appointment.time_slot, timezone);

        let refundPercentage = 0;
        if (hoursUntilAppointment > 24) {
            refundPercentage = 100;
        } else if (hoursUntilAppointment > 12) {
            refundPercentage = 50;
        }

        const refundAmount = (payment.amount * refundPercentage) / 100;

        if (refundAmount === 0) {
            return res.status(400).json({
                message: 'No refund available. Cancellation is within 12 hours of appointment.'
            });
        }

        // Find the PaymentTransaction to track this refund's lifecycle
        const txn = await PaymentTransaction.findOne({ where: { appointment_id: payment.appointment_id } });

        try {
            const refund = await stripe.refunds.create({
                payment_intent: payment.payment_intent_id || payment.transaction_id,
                amount: Math.round(refundAmount / 280 * 100), // PKR -> USD cents
                reason: 'requested_by_customer',
                metadata: { reason: reason || 'Appointment cancelled' }
            });

            // Update Payment record
            payment.status = 'refunded';
            payment.refund_id = refund.id;
            payment.refund_amount = refundAmount;
            payment.refund_reason = reason || 'Appointment cancelled';
            await payment.save();

            // Update PaymentTransaction
            if (txn) {
                txn.refund_status = refundPercentage === 100 ? 'full' : 'partial';
                txn.refund_amount = refundAmount;
                txn.refund_transaction_id = refund.id;
                txn.refund_initiated_at = new Date();
                txn.refund_completed_at = new Date();
                await txn.save();
            }

            res.json({ message: 'Refund processed successfully', refundAmount, refundPercentage, refundId: refund.id });
        } catch (stripeErr) {
            console.error('[STRIPE REFUND FAILED]', stripeErr.message);

            // Mark refund as failed so admin/cron can retry
            if (txn) {
                txn.refund_status = 'failed';
                txn.refund_amount = refundAmount;
                txn.refund_initiated_at = new Date();
                await txn.save();
            }

            return res.status(500).json({
                message: 'Stripe refund failed. The appointment is still cancelled. Our team will retry the refund.',
                refundAmount,
                refundPercentage
            });
        }
    } catch (error) {
        console.error('Refund processing error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get Payment History
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = async (req, res) => {
    try {
        const { Patient, Doctor, User } = require('../models');
        let payments;

        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patient) return res.json([]);

            payments = await Payment.findAll({
                include: [{
                    model: Appointment,
                    where: { patient_id: patient.id },
                    include: [
                        { model: Doctor, include: [{ model: User, attributes: ['name'] }] }
                    ]
                }],
                order: [['createdAt', 'DESC']]
            });
        } else if (req.user.role === 'doctor') {
            const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctor) return res.json([]);

            payments = await Payment.findAll({
                include: [{
                    model: Appointment,
                    where: { doctor_id: doctor.id },
                    include: [
                        { model: Patient, include: [{ model: User, attributes: ['name'] }] }
                    ]
                }],
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Admin - all payments
            payments = await Payment.findAll({
                include: [{
                    model: Appointment,
                    include: [
                        { model: Patient, include: [{ model: User, attributes: ['name'] }] },
                        { model: Doctor, include: [{ model: User, attributes: ['name'] }] }
                    ]
                }],
                order: [['createdAt', 'DESC']]
            });
        }

        res.json(payments);
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Payment Receipt (PDF)
// @route   GET /api/payments/:id/receipt
// @access  Private
const getPaymentReceipt = async (req, res) => {
    const { id } = req.params;

    try {
        const { Patient, Doctor, User } = require('../models');

        const payment = await Payment.findByPk(id, {
            include: [{
                model: Appointment,
                include: [
                    { model: Patient, include: [{ model: User }] },
                    { model: Doctor, include: [{ model: User }] }
                ]
            }]
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // TODO: Generate PDF using PDFKit (Phase 8)
        // For now, return JSON receipt
        const receipt = {
            receiptId: payment.id,
            date: payment.createdAt,
            patient: payment.Appointment.Patient.User.name,
            doctor: payment.Appointment.Doctor.User.name,
            appointmentDate: payment.Appointment.date,
            appointmentTime: payment.Appointment.time_slot,
            amount: payment.amount,
            paymentMethod: payment.payment_method,
            status: payment.status,
            transactionId: payment.transaction_id,
            refundAmount: payment.refund_amount || 0
        };

        res.json(receipt);
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    processRefund,
    getPaymentHistory,
    getPaymentReceipt
};
