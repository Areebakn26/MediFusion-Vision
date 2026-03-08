const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * 1. Send Verification/Welcome Email
 */
const sendVerificationEmail = async (to, userName, loginLink) => {
    const mailOptions = {
        from: `"MediFusion Vision" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Welcome to MediFusion Vision! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">Welcome, ${userName}!</h2>
                <p>Thank you for registering with MediFusion Vision.</p>
                <p>Your account has been created successfully. You can now log in to access your dashboard.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginLink}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Log In Now
                    </a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #6b7280; word-break: break-all;">${loginLink}</p>
                
                <p>If you didn't create an account, please ignore this email.</p>
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Verification/Welcome email sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Verification/Welcome email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 2. Send Doctor Status Notification (Approval/Rejection)
 */
const sendDoctorStatusNotification = async (to, doctorName, status) => {
    const isApproved = status === 'approved';
    const subjectTitle = isApproved ? 'Application Approved ✅' : 'Application Update';
    const titleColor = isApproved ? '#10b981' : '#f59e0b';

    let messageBody = '';
    if (isApproved) {
        messageBody = `
            <p>Congratulations! Your doctor profile has been <strong>approved</strong> by our administration team.</p>
            <p>You can now log in, set your availability, and start accepting appointments.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Access Your Dashboard
                </a>
            </div>
        `;
    } else {
        messageBody = `
            <p>We have reviewed your doctor profile application. Unfortunately, it has been <strong>rejected</strong> at this time.</p>
            <p>Please contact support or review your application details for more information.</p>
        `;
    }

    const mailOptions = {
        from: `"MediFusion Vision Admin" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Doctor Profile ${status.charAt(0).toUpperCase() + status.slice(1)} - MediFusion Vision`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: ${titleColor};">${subjectTitle}</h2>
                <p>Dear Dr. ${doctorName},</p>
                ${messageBody}
                <p>Best regards,<br><strong>MediFusion Vision Admin Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Doctor status (${status}) notification sent to ${to}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Doctor status notification to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 3. Send Appointment Confirmation
 */
const sendAppointmentConfirmation = async (patientEmail, patientName, doctorName, appointmentDate, timeSlot, appointmentType, meetingLink) => {
    const typeLabel = appointmentType === 'virtual' ? 'Virtual Consultation 💻' : 'Physical Visit 🏥';

    const mailOptions = {
        from: `"MediFusion Vision Appointments" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Appointment Confirmed - MediFusion Vision',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">Appointment Confirmed ✅</h2>
                <p>Dear ${patientName},</p>
                <p>Your appointment has been successfully booked. Here are the details:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabel}</p>
                    ${appointmentType === 'virtual' && meetingLink ? `<p style="margin: 5px 0; margin-top: 15px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb; font-weight: bold;">Join Video Call</a></p>` : ''}
                </div>
                
                <p>Please log in to your dashboard if you need to reschedule or cancel. Cancellations must be made at least 24 hours in advance for a full refund.</p>
                
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Appointment confirmation sent to patient ${patientEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Appointment confirmation to ${patientEmail}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 4. Send Cancellation Notification (To Patient and Doctor)
 */
const sendCancellationNotification = async (patientEmail, doctorEmail, patientName, doctorName, appointmentDate, timeSlot, refundInfo) => {
    let refundHtml = '';

    if (refundInfo && refundInfo.refundAmount > 0) {
        refundHtml = `
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h4 style="margin-top: 0; color: #065f46;">Refund Processed</h4>
                <p style="margin: 5px 0;"><strong>Amount:</strong> PKR ${refundInfo.refundAmount} (${refundInfo.refundPercentage}%)</p>
                <p style="margin: 5px 0; font-size: 14px; color: #047857;">Refunds typically take 5-7 business days to reflect in your account.</p>
            </div>
        `;
    } else {
        refundHtml = `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #4b5563;">Based on our cancellation policy and the time of cancellation, no refund is applicable for this booking.</p>
            </div>
         `;
    }

    // Patient Email
    const patientMailOptions = {
        from: `"MediFusion Vision" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Appointment Cancelled - MediFusion Vision',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #ef4444;">Appointment Cancelled ❌</h2>
                <p>Dear ${patientName},</p>
                <p>Your appointment with Dr. ${doctorName} has been cancelled.</p>
                
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                </div>
                
                ${refundHtml}
                
                <p>If you have any questions, please contact our support team.</p>
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    // Doctor Email
    const doctorMailOptions = {
        from: `"MediFusion Vision Appointments" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: 'Appointment Cancelled - MediFusion Vision',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #ef4444;">Appointment Cancelled ❌</h2>
                <p>Dear Dr. ${doctorName},</p>
                <p>An appointment scheduled with patient ${patientName} has been cancelled.</p>
                
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                </div>
                
                <p>Your calendar has been updated accordingly.</p>
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await Promise.all([
            transporter.sendMail(patientMailOptions),
            doctorEmail ? transporter.sendMail(doctorMailOptions) : Promise.resolve()
        ]);
        console.log(`[EMAIL] Cancellation notifications sent to ${patientEmail} and ${doctorEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Cancellation notifications:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 5. Send Report Ready Email
 */
const sendReportReadyEmail = async (patientEmail, patientName, reportDownloadLink) => {
    const mailOptions = {
        from: `"MediFusion Vision Reports" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Medical Report Ready for Download 📄',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #8b5cf6;">Your Report is Ready!</h2>
                <p>Dear ${patientName},</p>
                <p>Your recent medical report has been finalized by your doctor and is now available for download.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${reportDownloadLink}" style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Download PDF Report
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">Please note: For security reasons, this link may expire or require you to log in to your MediFusion Vision account.</p>
                
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Report ready email sent to ${patientEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Report ready email to ${patientEmail}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send Password Reset Email (Kept for completeness)
 */
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;

    const mailOptions = {
        from: `"MediFusion Vision Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - MediFusion Vision',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #dc2626;">Password Reset Request 🔒</h2>
                <p>You requested to reset your password. Click the button below to proceed:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
                
                <p>This link will expire in 1 hour.</p>
                
                <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Password reset email sent to ${email}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send password reset email to ${email}:`, error.message);
        return { success: false, error: error.message };
    }
};

// Also send to doctor for appointment confirmation
const sendDoctorAppointmentNotification = async (doctorEmail, doctorName, patientName, appointmentDate, timeSlot, appointmentType) => {
    const typeLabel = appointmentType === 'virtual' ? 'Virtual Consultation' : 'Physical Visit';

    const mailOptions = {
        from: `"MediFusion Vision Appointments" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: 'New Appointment Scheduled - MediFusion Vision',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">New Appointment Scheduled 📅</h2>
                <p>Dear Dr. ${doctorName},</p>
                <p>A new appointment has been scheduled by a patient:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabel}</p>
                </div>
                
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Doctor appointment notification sent to ${doctorEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Doctor appointment notification to ${doctorEmail}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 6. Send Pre-Appointment Reminder (Cron Job)
 */
const sendAppointmentReminder = async (patientEmail, doctorEmail, patientName, doctorName, appointmentDate, timeSlot, appointmentType, meetingLink) => {
    const typeLabel = appointmentType === 'virtual' ? 'Virtual Consultation 💻' : 'Physical Visit 🏥';

    // 1. Patient Reminder Email
    const patientMailOptions = {
        from: `"MediFusion Vision Reminders" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Reminder: Upcoming Appointment Tomorrow ⏰',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">Appointment Reminder</h2>
                <p>Dear ${patientName},</p>
                <p>This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabel}</p>
                    ${appointmentType === 'virtual' && meetingLink ? `<p style="margin: 5px 0; margin-top: 15px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb; font-weight: bold;">Join Video Call</a></p>` : ''}
                </div>
                
                <p>If you need to reschedule or cancel, please do so via your dashboard as soon as possible according to our cancellation policies.</p>
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    // 2. Doctor Reminder Email
    const doctorMailOptions = {
        from: `"MediFusion Vision Reminders" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: 'Reminder: Upcoming Appointment Tomorrow ⏰',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">Appointment Reminder</h2>
                <p>Dear Dr. ${doctorName},</p>
                <p>This is a reminder for an upcoming appointment scheduled for <strong>tomorrow</strong>.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${appointmentDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabel}</p>
                </div>
                
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await Promise.all([
            transporter.sendMail(patientMailOptions),
            transporter.sendMail(doctorMailOptions)
        ]);
        console.log(`[EMAIL] Reminders sent to ${patientEmail} and ${doctorEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send reminders:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * 7. Send Reschedule Notification (To Patient and Doctor)
 */
const sendRescheduleNotification = async (patientEmail, doctorEmail, patientName, doctorName, oldDate, oldTimeSlot, newDate, newTimeSlot, appointmentType, meetingLink) => {
    const typeLabel = appointmentType === 'virtual' ? 'Virtual Consultation 💻' : 'Physical Visit 🏥';

    // Patient Email
    const patientMailOptions = {
        from: `"MediFusion Vision Appointments" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Appointment Rescheduled ✅',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #2563eb;">Appointment Rescheduled</h2>
                <p>Dear ${patientName},</p>
                <p>Your appointment with Dr. ${doctorName} has been successfully rescheduled.</p>
                
                <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 5px 0; color: #92400e;"><strong>Previous Schedule:</strong><br/>
                    <del>${oldDate} at ${oldTimeSlot}</del></p>
                </div>

                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                    <p style="margin: 5px 0; color: #166534;"><strong>New Schedule:</strong></p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${newDate}</p>
                    <p style="margin: 5px 0;"><strong>Time:</strong> ${newTimeSlot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabel}</p>
                    ${appointmentType === 'virtual' && meetingLink ? `<p style="margin: 5px 0; margin-top: 15px;"><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb; font-weight: bold;">Join Video Call</a></p>` : ''}
                </div>
                
                <p>If you have any further changes, please refer to our policies in your dashboard.</p>
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    // Doctor Email
    const doctorMailOptions = {
        from: `"MediFusion Vision Appointments" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: 'Patient Appointment Rescheduled 🔄',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #f59e0b;">Appointment Rescheduled</h2>
                <p>Dear Dr. ${doctorName},</p>
                <p>An appointment with patient ${patientName} has been rescheduled to a new time.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
                    <p style="margin: 5px 0; color: #6b7280;"><strong>Old Time:</strong> <del>${oldDate} at ${oldTimeSlot}</del></p>
                    <p style="margin: 5px 0;"><strong>New Date:</strong> ${newDate}</p>
                    <p style="margin: 5px 0;"><strong>New Time:</strong> ${newTimeSlot}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabel}</p>
                </div>
                
                <p>Your calendar has been updated automatically.</p>
                <p>Best regards,<br><strong>MediFusion Vision Team</strong></p>
            </div>
        `,
    };

    try {
        await Promise.all([
            transporter.sendMail(patientMailOptions),
            doctorEmail ? transporter.sendMail(doctorMailOptions) : Promise.resolve()
        ]);
        console.log(`[EMAIL] Reschedule notifications sent to ${patientEmail} and ${doctorEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send Reschedule notifications:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail,
    sendDoctorStatusNotification,
    sendAppointmentConfirmation,
    sendCancellationNotification,
    sendReportReadyEmail,
    sendPasswordResetEmail,
    sendDoctorAppointmentNotification,
    sendAppointmentReminder,
    sendRescheduleNotification
};
