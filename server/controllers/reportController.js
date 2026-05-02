const { Patient, User, Appointment, Doctor, Notification } = require('../models');
const { sendReportReadyEmail } = require('../utils/emailService');

// @desc    Generate a medical report for a patient
// @route   POST /api/reports/generate
// @access  Private (Doctor)
const generateReport = async (req, res) => {
    // In Task 2, this will receive actual diagnosis and prescription data to generate a PDF.
    const { appointmentId, patientId, diagnosis, prescription, scanId } = req.body;

    try {
        // 1. Verify doctor authorization
        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctorProfile) {
            return res.status(403).json({ message: 'Not authorized as a doctor.' });
        }

        // 2. Find the patient to get their email and name
        const patient = await Patient.findByPk(patientId, {
            include: [{ model: User, attributes: ['id', 'name', 'email'] }]
        });

        if (!patient || !patient.User) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // 3. Mocking the PDF generation
        const mockReportUrl = `http://localhost:5000/api/reports/download/mock-report-${Date.now()}.pdf`;

        // 4. Create In-App Notification
        await Notification.create({
            user_id: patient.User.id,
            title: 'Diagnostic Report Ready',
            message: `Your diagnostic report for the recent consultation is now available.`,
            type: 'report',
            data: { appointmentId, scanId }
        });

        // 5. Send Email
        await sendReportReadyEmail(patient.User.email, patient.User.name, mockReportUrl);

        res.status(200).json({
            message: 'Report generated successfully and patient notified.',
            reportUrl: mockReportUrl
        });

    } catch (error) {
        console.error('Report Generation Error:', error);
        res.status(500).json({ message: 'Server error generating report' });
    }
};

module.exports = {
    generateReport
};
