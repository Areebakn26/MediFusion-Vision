const { Appointment, Doctor, Patient, User, Payment } = require('../models');
const { sendAppointmentConfirmation, sendDoctorAppointmentNotification, sendCancellationNotification, sendRescheduleNotification } = require('../utils/emailService');
const { Op } = require('sequelize');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { getRegionalTime, getHoursUntil } = require('../utils/timezone');
const moment = require('moment-timezone');

// Helper to parse time string to minutes
const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (hours !== 12 && modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
};

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (Patient)
const bookAppointment = async (req, res) => {
    const { doctorId, date, timeSlot, type, notes } = req.body;

    try {
        // 1. Get Doctor Profile to determine Timezone
        const doctorProfile = await Doctor.findOne({ where: { user_id: doctorId } });
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        const timezone = doctorProfile.timezone || 'Asia/Karachi';

        // 2. Validate Time Slot via exact Regional Time calculation
        const originalStartTime = getRegionalTime(date, timeSlot, timezone);
        const hoursUntil = getHoursUntil(date, timeSlot, timezone);

        if (hoursUntil < 0) {
            return res.status(400).json({ message: 'This time slot has already passed.' });
        }
        if (hoursUntil < 0.5) {
            return res.status(400).json({ message: 'This time slot is too soon. Please select a time at least 30 minutes from now.' });
        }

        const appointmentDate = new Date(date); // Generic date for Day of Week string

        // 3. Get Patient Profile
        const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
        if (!patientProfile) {
            return res.status(404).json({ message: 'Patient profile not found. Please complete your profile.' });
        }

        // 4. Check patient profile completion
        const missingFields = [];
        if (!patientProfile.cnic) missingFields.push('CNIC');
        if (!patientProfile.date_of_birth) missingFields.push('Date of Birth');
        if (!patientProfile.emergency_contact_phone) missingFields.push('Emergency Contact Phone');

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Please complete your profile before booking appointments. Missing: ${missingFields.join(', ')}`,
                missingFields
            });
        }

        // 5. Check doctor is verified  (Doctor Profile already fetched)

        // 6. Check doctor is verified
        if (doctorProfile.verification_status !== 'approved') {
            return res.status(400).json({ message: 'This doctor is not yet verified and cannot accept appointments.' });
        }

        // 7. Check for Conflicts (double booking)
        const existingAppointment = await Appointment.findOne({
            where: {
                doctor_id: doctorProfile.id,
                date: date,
                time_slot: timeSlot,
                status: { [Op.ne]: 'cancelled' }
            }
        });

        if (existingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked. Please select another time.' });
        }

        // 8. Check if patient already has appointment at same time with any doctor
        const patientConflict = await Appointment.findOne({
            where: {
                patient_id: patientProfile.id,
                date: date,
                time_slot: timeSlot,
                status: { [Op.ne]: 'cancelled' }
            }
        });

        if (patientConflict) {
            return res.status(400).json({ message: 'You already have an appointment at this time.' });
        }

        // 9. Check doctor's unavailable dates
        if (doctorProfile.unavailable_dates && doctorProfile.unavailable_dates.includes(date)) {
            return res.status(400).json({ message: 'Doctor is not available on this date.' });
        }

        // 10. Verify Doctor Working Hours (if availability is set)
        if (doctorProfile.working_hours) {
            const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
            let daySchedule = doctorProfile.working_hours[dayName];

            // If new nested structure is present, pick the requested type
            if (daySchedule && daySchedule[type]) {
                daySchedule = daySchedule[type];
            }

            if (!daySchedule || !daySchedule.start) {
                return res.status(400).json({ message: `Doctor is not available for ${type} appointments on ${dayName}s.` });
            }

            const slotTime = parseTime(timeSlot);
            const startTime = parseTime(daySchedule.start);
            const endTime = parseTime(daySchedule.end);

            if (slotTime < startTime || slotTime >= endTime) {
                return res.status(400).json({
                    message: `Selected time is outside doctor's ${type} working hours (${daySchedule.start} - ${daySchedule.end}).`
                });
            }
        }

        // 11. Create Appointment with meeting link for virtual consultations
        const meetingLink = type === 'virtual'
            ? `${process.env.CLIENT_URL}/consultation/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            : null;

        const appointment = await Appointment.create({
            patient_id: patientProfile.id,
            doctor_id: doctorProfile.id,
            date,
            time_slot: timeSlot,
            original_start_time: originalStartTime,
            type,
            meeting_link: meetingLink,
            reason: notes, // Mapping notes to reason
            status: 'pending'
        });

        // Fetch patient and doctor users to get their emails and names
        const patientUser = await User.findByPk(req.user.id);
        const doctorUser = await User.findByPk(doctorId);

        if (patientUser && doctorUser) {
            await sendAppointmentConfirmation(patientUser.email, patientUser.name, doctorUser.name, date, timeSlot, type, meetingLink);
            await sendDoctorAppointmentNotification(doctorUser.email, doctorUser.name, patientUser.name, date, timeSlot, type);
        }

        res.status(201).json(appointment);
    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get appointments for logged in user
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        let appointments;

        if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile) return res.json([]);

            appointments = await Appointment.findAll({
                where: { doctor_id: doctorProfile.id },
                include: [
                    {
                        model: Patient,
                        include: [{ model: User, attributes: ['name', 'email'] }]
                    }
                ],
                order: [['date', 'ASC'], ['time_slot', 'ASC']]
            });
        } else {
            const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patientProfile) return res.json([]);

            appointments = await Appointment.findAll({
                where: { patient_id: patientProfile.id },
                include: [
                    {
                        model: Doctor,
                        include: [{ model: User, attributes: ['name', 'email'] }]
                    }
                ],
                order: [['date', 'ASC'], ['time_slot', 'ASC']]
            });
        }

        // Flatten structure for frontend convenience if needed, or handle in frontend
        // Frontend expects: app.doctor.name, app.patient.name
        const formattedAppointments = appointments.map(app => {
            const plainApp = app.get({ plain: true });
            return {
                ...plainApp,
                _id: plainApp.id, // Frontend uses _id
                patient: plainApp.Patient ? { ...plainApp.Patient, name: plainApp.Patient.User.name, email: plainApp.Patient.User.email } : null,
                doctor: plainApp.Doctor ? { ...plainApp.Doctor, name: plainApp.Doctor.User.name, email: plainApp.Doctor.User.email } : null,
                timeSlot: plainApp.time_slot, // Frontend uses camelCase
                notes: plainApp.reason
            };
        });

        res.json(formattedAppointments);
    } catch (error) {
        console.error("Get Appointments Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor/Admin)
const updateAppointmentStatus = async (req, res) => {
    const { status, meetingLink } = req.body;

    try {
        const appointment = await Appointment.findByPk(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify ownership
        if (req.user.role !== 'admin') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile || appointment.doctor_id !== doctorProfile.id) {
                return res.status(401).json({ message: 'Not authorized' });
            }
        }

        appointment.status = status;
        if (meetingLink) {
            appointment.meeting_link = meetingLink;
        }

        await appointment.save();
        res.json(appointment);
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Check appointment availability
// @route   GET /api/appointments/check-availability
// @access  Public
const checkAvailability = async (req, res) => {
    const { doctorId, date, timeSlot } = req.query;

    try {
        // 1. Validate date hasn't passed
        // Normalize date to local timezone to avoid UTC issues
        const [year, month, day] = date.split('-').map(Number);
        const appointmentDate = new Date(year, month - 1, day); // month is 0-indexed
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
            return res.json({ available: false, message: 'Cannot book appointments for past dates.' });
        }

        // 2. If today, check if time has passed
        const now = new Date();
        // Use a more reliable date comparison that handles timezone issues
        const appointmentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (appointmentDateStr === todayStr) {
            const slotMinutes = parseTime(timeSlot);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Only reject if slot is actually in the past (not just close)
            if (slotMinutes < currentMinutes) {
                return res.json({ available: false, message: 'This time slot has already passed.' });
            }
            if (slotMinutes <= currentMinutes + 30) {
                return res.json({ available: false, message: 'This time slot is too soon. Please select a time at least 30 minutes from now.' });
            }
        }

        // 3. Get doctor profile
        const doctorProfile = await Doctor.findByPk(doctorId);
        if (!doctorProfile) {
            return res.json({ available: false, message: 'Doctor not found.' });
        }

        // 4. Check doctor verification
        if (doctorProfile.verification_status !== 'approved') {
            return res.json({ available: false, message: 'Doctor is not verified.' });
        }

        // 5. Check doctor's unavailable dates
        if (doctorProfile.unavailable_dates && doctorProfile.unavailable_dates.includes(date)) {
            return res.json({ available: false, message: 'Doctor is not available on this date.' });
        }

        // 6. Check working hours
        if (doctorProfile.working_hours) {
            const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

            // For checkAvailability where type isn't passed (legacy), check both
            const rawSchedule = doctorProfile.working_hours[dayName];
            let isAvailable = false;

            if (rawSchedule) {
                // If it's a legacy flat schedule OR we manually check physical/virtual
                const checkSlot = (schedule) => {
                    if (!schedule || !schedule.start) return false;
                    const slotTime = parseTime(timeSlot);
                    const startTime = parseTime(schedule.start);
                    const endTime = parseTime(schedule.end);
                    return slotTime >= startTime && slotTime < endTime;
                };

                if (rawSchedule.start) {
                    isAvailable = checkSlot(rawSchedule);
                } else {
                    isAvailable = checkSlot(rawSchedule.physical) || checkSlot(rawSchedule.virtual);
                }
            }

            if (!isAvailable) {
                return res.json({
                    available: false,
                    message: `Outside working hours.`
                });
            }
        }

        // 7. Check for existing bookings (conflicts)
        const existingAppointment = await Appointment.findOne({
            where: {
                doctor_id: doctorId,
                date: date,
                time_slot: timeSlot,
                status: { [Op.ne]: 'cancelled' }
            }
        });

        if (existingAppointment) {
            return res.json({ available: false, message: 'This slot is already booked.' });
        }

        res.json({ available: true, message: 'Slot is available!' });
    } catch (error) {
        console.error("Check Availability Error:", error);
        res.status(500).json({ available: false, message: 'Server error' });
    }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Patient)
const rescheduleAppointment = async (req, res) => {
    const { id } = req.params;
    const { newDate, newTimeSlot } = req.body;

    try {
        // 1. Get the appointment and associated profiles first
        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: Doctor, include: [User] },
                { model: Patient, include: [User] }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const doctorProfile = appointment.Doctor;
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        const timezone = doctorProfile.timezone || 'Asia/Karachi';

        // 2. Validate New Time Slot via exact Regional Time calculation
        const hoursUntilNew = getHoursUntil(newDate, newTimeSlot, timezone);

        if (hoursUntilNew < 0) {
            return res.status(400).json({ message: 'Cannot reschedule to a past date.' });
        }
        if (hoursUntilNew < 0.5) {
            return res.status(400).json({ message: 'This time slot is too soon. Please select a time at least 30 minutes from now.' });
        }

        const appointmentDate = new Date(newDate); // Generic date for Day of Week string

        // 3. Verify ownership (patient can only reschedule their own)
        const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
        if (!patientProfile) {
            return res.status(404).json({ message: 'Patient profile not found.' });
        }
        if (appointment.patient_id !== patientProfile.id) {
            return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
        }

        // 4. Check if appointment can be rescheduled (not completed/cancelled)
        if (['completed', 'cancelled'].includes(appointment.status)) {
            return res.status(400).json({ message: 'Cannot reschedule completed or cancelled appointments' });
        }

        // 5. Check doctor is verified
        if (doctorProfile.verification_status !== 'approved') {
            return res.status(400).json({ message: 'This doctor is not verified and cannot accept appointments.' });
        }

        // 8. Check doctor's unavailable dates
        if (doctorProfile.unavailable_dates && doctorProfile.unavailable_dates.includes(newDate)) {
            return res.status(400).json({ message: 'Doctor is not available on this date.' });
        }

        // 9. Check doctor's working hours (if set)
        if (doctorProfile.working_hours) {
            const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
            let daySchedule = doctorProfile.working_hours[dayName];

            // If nested structure is present, check against current appointment type
            if (daySchedule && daySchedule[appointment.type]) {
                daySchedule = daySchedule[appointment.type];
            }

            if (!daySchedule || !daySchedule.start) {
                return res.status(400).json({ message: `Doctor is not available for ${appointment.type} appointments on ${dayName}s.` });
            }

            const slotTime = parseTime(newTimeSlot);
            const startTime = parseTime(daySchedule.start);
            const endTime = parseTime(daySchedule.end);

            if (slotTime < startTime || slotTime >= endTime) {
                return res.status(400).json({
                    message: `Selected time is outside doctor's ${appointment.type} working hours (${daySchedule.start} - ${daySchedule.end}).`
                });
            }
        }

        // 10. Calculate highly accurate hours until original appointment
        const hoursUntilAppointment = getHoursUntil(appointment.date, appointment.time_slot, timezone);

        // 11. Enforce Reschedule Policy
        // If rescheduling within 24 hours of the original appointment, it's not allowed directly
        // The user must cancel and book a new one. Wait, the requirement says:
        // "Reschedule within 24 hours: Treated as a cancellation followed by a new booking."
        // We will reject it here and tell the frontend to handle it via cancellation flow.
        if (hoursUntilAppointment <= 24 && req.user.role === 'patient') {
            return res.status(400).json({
                message: 'Free rescheduling is only allowed up to 24 hours before the appointment. Please cancel this appointment and book a new one.'
            });
        }

        // 12. Check for conflicts (double booking) - exclude current appointment
        const conflictingAppointment = await Appointment.findOne({
            where: {
                doctor_id: appointment.doctor_id,
                date: newDate,
                time_slot: newTimeSlot,
                status: { [Op.ne]: 'cancelled' },
                id: { [Op.ne]: id } // Exclude current appointment
            }
        });

        if (conflictingAppointment) {
            return res.status(400).json({ message: 'This time slot is already booked. Please select another time.' });
        }

        // 13. Check if patient already has appointment at same time with any doctor
        const patientConflict = await Appointment.findOne({
            where: {
                patient_id: patientProfile.id,
                date: newDate,
                time_slot: newTimeSlot,
                status: { [Op.ne]: 'cancelled' },
                id: { [Op.ne]: id } // Exclude current appointment
            }
        });

        if (patientConflict) {
            return res.status(400).json({ message: 'You already have an appointment at this time.' });
        }

        // 12. Update appointment
        const oldDate = appointment.date;
        const oldTimeSlot = appointment.time_slot;
        appointment.date = newDate;
        appointment.time_slot = newTimeSlot;
        appointment.original_start_time = getRegionalTime(newDate, newTimeSlot, timezone);
        appointment.reschedule_count = (appointment.reschedule_count || 0) + 1;
        await appointment.save();

        // Send reschedule notification email to both parties
        if (appointment.Patient && appointment.Patient.User) {
            const patientUser = appointment.Patient.User;
            const doctorUser = appointment.Doctor && appointment.Doctor.User ? appointment.Doctor.User : null;
            const doctorName = doctorUser ? doctorUser.name : 'Unknown';
            const doctorEmail = doctorUser ? doctorUser.email : null;

            // Try to construct meeting link if virtual
            const meetingLink = appointment.type === 'virtual'
                ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/patient/consultation/${appointment.id}`
                : null;

            await sendRescheduleNotification(
                patientUser.email,
                doctorEmail,
                patientUser.name,
                doctorName,
                oldDate,
                oldTimeSlot,
                newDate,
                newTimeSlot,
                appointment.type,
                meetingLink
            );
        }

        console.log(`[NOTIFICATION] Appointment ${id} rescheduled to ${newDate} ${newTimeSlot}`);

        res.json({ message: 'Appointment rescheduled successfully', appointment });
    } catch (error) {
        console.error('Reschedule Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Patient/Doctor)
const cancelAppointment = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: Patient, include: [User] },
                { model: Doctor, include: [User] }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Verify ownership
        const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });

        const isPatient = patientProfile && appointment.patient_id === patientProfile.id;
        const isDoctor = doctorProfile && appointment.doctor_id === doctorProfile.id;

        if (!isPatient && !isDoctor && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
        }

        // Check if already cancelled
        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Appointment already cancelled' });
        }

        // Calculate refund amount based on cancellation policy
        const payment = await Payment.findOne({ where: { appointment_id: id } });

        let refundAmount = 0;
        let refundPercentage = 0;

        if (payment && payment.status === 'completed' && payment.transaction_id) {
            const timezone = appointment.Doctor?.timezone || 'Asia/Karachi';
            const hoursUntilAppointment = getHoursUntil(appointment.date, appointment.time_slot, timezone);

            // Cancellation Policy
            if (hoursUntilAppointment > 24) {
                refundPercentage = 100; // Full refund
            } else if (hoursUntilAppointment > 12) {
                refundPercentage = 50; // 50% refund
            } else {
                refundPercentage = 0; // No refund
            }

            refundAmount = (payment.amount * refundPercentage) / 100;

            // Process refund if applicable
            if (refundAmount > 0) {
                try {
                    console.log(`[REFUND] Processing ${refundPercentage}% refund: PKR ${refundAmount} via Stripe`);

                    // Convert PKR to Paisa or cent equivalent based on how it was charged
                    // Usually amount is stored as the full value, Stripe expects cents
                    const stripeRefund = await stripe.refunds.create({
                        payment_intent: payment.transaction_id,
                        amount: Math.round(refundAmount / 280 * 100), // Convert PKR to USD cents (assuming 280 exchange rate used backwards)
                        reason: 'requested_by_customer',
                        metadata: {
                            reason: reason || 'Appointment cancelled by patient'
                        }
                    });

                    payment.status = 'refunded';
                    payment.refund_amount = refundAmount;
                    payment.refund_reason = reason || 'Appointment cancelled';
                    payment.refund_id = stripeRefund.id;
                    await payment.save();
                } catch (stripeErr) {
                    console.error("Stripe refund failed:", stripeErr);
                    // Don't block cancellation if refund fails, but log it
                }
            } else {
                // No refund, but mark payment as processed for cancellation
                payment.refund_reason = 'Cancelled within 12h - No Refund';
                await payment.save();
            }
        } else {
            // No completed payment found. Check if there's a pending Stripe intent to cancel.
            try {
                // Try to find the payment transaction directly, as Payment model might not exist for incomplete flows
                const PaymentTransaction = sequelize.models.PaymentTransaction;
                if (PaymentTransaction) {
                    const pendingTransaction = await PaymentTransaction.findOne({ where: { appointment_id: id } });
                    if (pendingTransaction && pendingTransaction.stripe_payment_intent_id) {
                        console.log(`[STRIPE] Canceling pending payment intent: ${pendingTransaction.stripe_payment_intent_id}`);
                        await stripe.paymentIntents.cancel(pendingTransaction.stripe_payment_intent_id);
                    }
                }
            } catch (cancelErr) {
                console.error("Failed to cancel Stripe intent (might already be canceled/succeeded):", cancelErr.message);
            }
        }

        // Update appointment status
        appointment.status = 'cancelled';
        appointment.cancelled_by = req.user.role === 'admin' ? 'admin' : (isPatient ? 'patient' : 'doctor');
        appointment.cancellation_reason = reason || 'No reason provided';
        await appointment.save();

        // Send cancellation notification email
        if (appointment.Patient && appointment.Patient.User) {
            const patientUser = appointment.Patient.User;
            const doctorUser = appointment.Doctor && appointment.Doctor.User ? appointment.Doctor.User : null;
            const doctorName = doctorUser ? doctorUser.name : 'Unknown';
            const doctorEmail = doctorUser ? doctorUser.email : null;
            const refundData = { refundAmount, refundPercentage };
            await sendCancellationNotification(patientUser.email, doctorEmail, patientUser.name, doctorName, appointment.date, appointment.time_slot, refundData);
        }

        console.log(`[NOTIFICATION] Appointment ${id} cancelled`);

        res.json({
            message: 'Appointment cancelled successfully',
            refundAmount,
            refundPercentage
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get available slots calculating doctor schedule and bookings
// @route   GET /api/appointments/available-slots
// @access  Public
const getAvailableSlots = async (req, res) => {
    const { doctorId, date } = req.query;
    try {
        if (!doctorId || !date) {
            return res.status(400).json({ message: 'Doctor ID and Date are required' });
        }

        const doctorProfile = await Doctor.findByPk(doctorId);
        if (!doctorProfile || doctorProfile.verification_status !== 'approved' ||
            (doctorProfile.unavailable_dates && doctorProfile.unavailable_dates.includes(date))) {
            return res.json({ availableSlots: [] });
        }

        const timezone = doctorProfile.timezone || 'Asia/Karachi';
        const now = moment().tz(timezone);
        const reqDate = moment.tz(date, "YYYY-MM-DD", timezone);

        if (reqDate.isBefore(now.startOf('day'))) {
            return res.json({ availableSlots: [] });
        }

        let workingHoursStart = 0;
        let workingHoursEnd = 0;

        if (doctorProfile.working_hours) {
            // Fix undefined appointmentDate error
            const dateObj = new Date(reqDate.format('YYYY-MM-DD'));
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const rawSchedule = doctorProfile.working_hours[dayName];

            if (!rawSchedule) return res.json({ availableSlots: [] });

            // Handle both flat {start, end} and nested {physical: {start, end}, virtual: {start, end}}
            if (rawSchedule.start) {
                workingHoursStart = parseTime(rawSchedule.start);
                workingHoursEnd = parseTime(rawSchedule.end);
            } else {
                let pStart = rawSchedule.physical?.start ? parseTime(rawSchedule.physical.start) : Infinity;
                let vStart = rawSchedule.virtual?.start ? parseTime(rawSchedule.virtual.start) : Infinity;
                let pEnd = rawSchedule.physical?.end ? parseTime(rawSchedule.physical.end) : 0;
                let vEnd = rawSchedule.virtual?.end ? parseTime(rawSchedule.virtual.end) : 0;

                workingHoursStart = Math.min(pStart, vStart);
                workingHoursEnd = Math.max(pEnd, vEnd);
            }
        } else {
            // Default 9 to 5
            workingHoursStart = 9 * 60;
            workingHoursEnd = 17 * 60;
        }

        if (workingHoursStart === Infinity) return res.json({ availableSlots: [] });

        const isToday = (reqDate.format('YYYY-MM-DD') === moment().tz(timezone).format('YYYY-MM-DD'));
        const currentMinutes = isToday ? (moment().tz(timezone).hours() * 60 + moment().tz(timezone).minutes() + 30) : 0;

        // Fetch existing appointments
        const existingAppointments = await Appointment.findAll({
            where: { doctor_id: doctorId, date: date, status: { [Op.ne]: 'cancelled' } },
            attributes: ['time_slot']
        });

        const bookedSlots = existingAppointments.map(a => parseTime(a.time_slot));

        // Generate thirty-minute slots
        const allTimeSlots = [
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
            "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
            "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
            "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
        ];

        const availableSlots = allTimeSlots.filter(slot => {
            const slotMinutes = parseTime(slot);
            if (slotMinutes < workingHoursStart || slotMinutes >= workingHoursEnd) return false;
            if (isToday && slotMinutes <= currentMinutes) return false;
            // Check if within 29 mins of any booked slot to prevent overlap
            const isBooked = bookedSlots.some(booked => Math.abs(booked - slotMinutes) < 29);
            return !isBooked;
        });

        res.json({ availableSlots });
    } catch (error) {
        console.error("Get Available Slots Error:", error);
        res.status(500).json({ availableSlots: [] });
    }
};

// @desc    Mark appointment as No-Show (Doctor only)
// @route   POST /api/appointments/:id/mark-no-show
// @access  Private (Doctor)
const markNoShow = async (req, res) => {
    const { id } = req.params;

    try {
        const appointment = await Appointment.findByPk(id, {
            include: [
                { model: Patient, include: [User] },
                { model: Doctor, include: [User] }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Only the doctor of this appointment can mark no-show
        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctorProfile || appointment.doctor_id !== doctorProfile.id) {
            return res.status(403).json({ message: 'Not authorized to mark this appointment as no-show' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot mark a cancelled appointment as no-show' });
        }

        if (appointment.no_show) {
            return res.status(400).json({ message: 'Appointment already marked as no-show' });
        }

        // Can only mark no-show within 24 hours AFTER the appointment time
        const timezone = doctorProfile.timezone || 'Asia/Karachi';
        const hoursAfter = -getHoursUntil(appointment.date, appointment.time_slot, timezone); // negative = past
        if (hoursAfter < 0) {
            return res.status(400).json({ message: 'Cannot mark no-show before the appointment time' });
        }
        if (hoursAfter > 24) {
            return res.status(400).json({ message: 'Can only mark no-show within 24 hours after the appointment' });
        }

        // Update appointment fields
        appointment.no_show = true;
        appointment.no_show_marked_at = new Date();
        appointment.status = 'completed'; // Treat as completed with no-show flag
        await appointment.save();

        // Notify patient by email
        if (appointment.Patient?.User) {
            const { sendCancellationNotification } = require('../utils/emailService');
            const patientUser = appointment.Patient.User;
            const doctorUser = appointment.Doctor?.User;
            const doctorName = doctorUser ? doctorUser.name : 'Unknown';
            // 0% refund for no-show
            await sendCancellationNotification(
                patientUser.email,
                null,
                patientUser.name,
                doctorName,
                appointment.date,
                appointment.time_slot,
                { refundAmount: 0, refundPercentage: 0, isNoShow: true }
            );
        }

        console.log(`[NO-SHOW] Appointment ${id} marked as no-show by doctor ${req.user.id}`);

        res.json({ message: 'Appointment marked as no-show successfully', appointment });
    } catch (error) {
        console.error('No-Show Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    bookAppointment,
    getAppointments,
    updateAppointmentStatus,
    checkAvailability,
    rescheduleAppointment,
    cancelAppointment,
    getAvailableSlots,
    markNoShow
};
