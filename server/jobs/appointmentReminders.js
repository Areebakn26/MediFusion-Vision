const cron = require('node-cron');
const { Appointment, Patient, Doctor, User, PaymentTransaction } = require('../models');
const { sendAppointmentReminder } = require('../utils/emailService');
const { Op } = require('sequelize');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Send appointment reminders for next day
 * Runs daily at 9:00 AM
 */
const scheduleAppointmentReminders = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('[CRON] Running appointment reminder job...');

        try {
            // Get tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowDate = tomorrow.toISOString().split('T')[0];

            // Find all confirmed appointments for tomorrow
            const appointments = await Appointment.findAll({
                where: {
                    date: tomorrowDate,
                    status: 'confirmed'
                },
                include: [
                    {
                        model: Patient,
                        include: [{ model: User, attributes: ['name', 'email'] }]
                    },
                    {
                        model: Doctor,
                        include: [{ model: User, attributes: ['name', 'email'] }]
                    }
                ]
            });

            console.log(`[CRON] Found ${appointments.length} appointments for ${tomorrowDate}`);

            // Send reminders
            for (const appointment of appointments) {
                try {
                    await sendAppointmentReminder(
                        appointment,
                        appointment.Patient,
                        appointment.Doctor
                    );
                    console.log(`[CRON] Reminder sent for appointment ${appointment.id}`);
                } catch (error) {
                    console.error(`[CRON] Failed to send reminder for appointment ${appointment.id}:`, error);
                }
            }

            console.log('[CRON] Appointment reminder job completed');
        } catch (error) {
            console.error('[CRON] Error in appointment reminder job:', error);
        }
    });

    console.log('[CRON] Appointment reminder scheduler initialized (runs daily at 9:00 AM)');
};

/**
 * Send 2-hour advance appointment reminders
 * Runs every hour
 */
const scheduleTwoHourReminders = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Running 2-hour appointment reminder job...');
        try {
            const twoHoursLater = new Date();
            twoHoursLater.setHours(twoHoursLater.getHours() + 2);
            const targetDate = twoHoursLater.toISOString().split('T')[0];
            const targetHour = twoHoursLater.getHours();
            const targetMinute = twoHoursLater.getMinutes();

            const appointments = await Appointment.findAll({
                where: { date: targetDate, status: 'confirmed' },
                include: [
                    { model: Patient, include: [{ model: User, attributes: ['name', 'email'] }] },
                    { model: Doctor, include: [{ model: User, attributes: ['name', 'email'] }] }
                ]
            });

            for (const apt of appointments) {
                try {
                    await sendAppointmentReminder(apt, apt.Patient, apt.Doctor, '2 hours');
                } catch (e) {
                    console.error(`[CRON] 2h reminder failed for ${apt.id}:`, e.message);
                }
            }
        } catch (error) {
            console.error('[CRON] 2-hour reminder job error:', error);
        }
    });
    console.log('[CRON] 2-hour reminder scheduler initialized (runs every hour)');
};

/**
 * Retry failed Stripe refunds daily
 * Runs daily at 11:00 PM
 */
const scheduleFailedRefundRetry = () => {
    cron.schedule('0 23 * * *', async () => {
        console.log('[CRON] Running failed refund retry job...');
        try {
            const failedTxns = await PaymentTransaction.findAll({
                where: { refund_status: 'failed' },
                include: [{ model: Appointment }]
            });

            console.log(`[CRON] Found ${failedTxns.length} failed refunds to retry`);

            for (const txn of failedTxns) {
                try {
                    const refundAmountCents = Math.round(parseFloat(txn.refund_amount) / 280 * 100);
                    const refund = await stripe.refunds.create({
                        payment_intent: txn.stripe_payment_intent_id,
                        amount: refundAmountCents,
                        reason: 'requested_by_customer'
                    });

                    txn.refund_status = parseFloat(txn.refund_amount) >= parseFloat(txn.amount_paid) ? 'full' : 'partial';
                    txn.refund_transaction_id = refund.id;
                    txn.refund_completed_at = new Date();
                    await txn.save();

                    console.log(`[CRON] Refund retry succeeded for txn ${txn.id}`);
                } catch (stripeErr) {
                    console.error(`[CRON] Refund retry still failed for txn ${txn.id}:`, stripeErr.message);
                }
            }

            console.log('[CRON] Failed refund retry job completed');
        } catch (error) {
            console.error('[CRON] Failed refund retry job error:', error);
        }
    });
    console.log('[CRON] Failed refund retry scheduler initialized (runs daily at 11:00 PM)');
};

/**
 * Clean up old cancelled appointments
 * Runs weekly on Sunday at midnight
 */
const scheduleOldAppointmentCleanup = () => {
    cron.schedule('0 0 * * 0', async () => {
        console.log('[CRON] Running old appointment cleanup job...');

        try {
            // Delete cancelled appointments older than 90 days
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const result = await Appointment.destroy({
                where: {
                    status: 'cancelled',
                    updatedAt: {
                        [Op.lt]: ninetyDaysAgo
                    }
                }
            });

            console.log(`[CRON] Deleted ${result} old cancelled appointments`);
        } catch (error) {
            console.error('[CRON] Error in cleanup job:', error);
        }
    });

    console.log('[CRON] Old appointment cleanup scheduler initialized (runs weekly on Sunday)');
};

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
    scheduleAppointmentReminders();
    scheduleTwoHourReminders();
    scheduleFailedRefundRetry();
    scheduleOldAppointmentCleanup();
    console.log('[CRON] All cron jobs initialized successfully');
};

module.exports = {
    initializeCronJobs,
    scheduleAppointmentReminders,
    scheduleTwoHourReminders,
    scheduleFailedRefundRetry,
    scheduleOldAppointmentCleanup
};
