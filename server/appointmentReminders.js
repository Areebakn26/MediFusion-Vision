const cron = require('node-cron');
const { Op } = require('sequelize');
const { Appointment, Patient, Doctor, User } = require('./models');
const { sendAppointmentReminder } = require('./utils/emailService');

const initCronJobs = () => {
    // Run every day at 08:00 AM server time
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Starting daily appointment reminder check...');
        try {
            // Get tomorrow's date string
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Format as YYYY-MM-DD
            const year = tomorrow.getFullYear();
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const day = String(tomorrow.getDate()).padStart(2, '0');
            const tomorrowStr = `${year}-${month}-${day}`;

            console.log(`[CRON] Looking for appointments on: ${tomorrowStr}`);

            // Find all confirmed appointments for tomorrow
            const upcomingAppointments = await Appointment.findAll({
                where: {
                    date: tomorrowStr,
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

            console.log(`[CRON] Found ${upcomingAppointments.length} appointments for tomorrow.`);

            // Send reminders
            for (const apt of upcomingAppointments) {
                if (apt.Patient?.User && apt.Doctor?.User) {
                    const patientName = apt.Patient.User.name;
                    const patientEmail = apt.Patient.User.email;
                    const doctorName = apt.Doctor.User.name;
                    const doctorEmail = apt.Doctor.User.email;

                    // Generate a generic meeting link if virtual. 
                    const meetingLink = apt.type === 'virtual' && process.env.CLIENT_URL
                        ? `${process.env.CLIENT_URL}/patient/consultation/${apt.id}`
                        : null;

                    await sendAppointmentReminder(
                        patientEmail,
                        doctorEmail,
                        patientName,
                        doctorName,
                        apt.date,
                        apt.time_slot,
                        apt.type,
                        meetingLink
                    );
                }
            }

            console.log('[CRON] Daily appointment reminders completed successfully.');
        } catch (error) {
            console.error('[CRON ERROR] Failed to process appointment reminders:', error);
        }
    });

    console.log('[CRON] Appointment reminder cron job initialized (runs at 08:00 AM daily).');
};

module.exports = initCronJobs;
