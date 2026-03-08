// testEmailMock.js
// This script demonstrates how the email service works without actually sending an email.
// It uses nodemailer-mock if available, or simply logs the mail options if not.

console.log("--- MOCK EMAIL TEST ---");
console.log("This test simulates the emailService without needing real credentials.\n");

// 1. Mock the nodemailer module before requiring emailService
const mockTransporter = {
    sendMail: async (mailOptions) => {
        console.log("✅ [MOCK SENDMAIL CALLED]");
        console.log("--------------------------------------------------");
        console.log(`FROM:    ${mailOptions.from}`);
        console.log(`TO:      ${mailOptions.to}`);
        console.log(`SUBJECT: ${mailOptions.subject}`);
        console.log("HTML BODY PREVIEW:");

        // Strip out some HTML tags for the console preview
        const plainTextPreview = mailOptions.html
            .replace(/<[^>]+>/g, '') // remove HTML tags
            .replace(/\s+/g, ' ')    // collapse whitespace
            .trim();

        console.log(`  ${plainTextPreview.substring(0, 150)}...`);
        console.log("--------------------------------------------------\n");
        return { messageId: "mock-id-12345" };
    }
};

// We need to intercept the require call for nodemailer in the emailService
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function () {
    if (arguments[0] === 'nodemailer') {
        return {
            createTransport: () => mockTransporter
        };
    }
    return originalRequire.apply(this, arguments);
};

// 2. Now require the emailService. It will use our mock transporter.
const emailService = require('./utils/emailService');

// 3. Test the functions
(async () => {
    try {
        console.log("Testing: sendVerificationEmail");
        await emailService.sendVerificationEmail('patient@example.com', 'John Doe', 'http://localhost:5173/login');

        console.log("Testing: sendAppointmentConfirmation");
        await emailService.sendAppointmentConfirmation(
            'patient@example.com',
            'John Doe',
            'Sarah Smith',
            '2026-03-10',
            '10:00 AM',
            'physical',
            null
        );

        console.log("Testing: sendDoctorStatusNotification");
        await emailService.sendDoctorStatusNotification('doctor@example.com', 'Sarah Smith', 'approved');

        console.log("All mock tests completed successfully.");
    } catch (error) {
        console.error("Mock Test Failed:", error);
    } finally {
        // Restore original require just in case
        Module.prototype.require = originalRequire;
    }
})();
