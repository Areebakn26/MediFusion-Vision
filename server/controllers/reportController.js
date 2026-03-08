const { Patient, User, Appointment, Doctor } = require('../models');
const { sendReportReadyEmail } = require('../utils/emailService');

// @desc    Generate a medical report for a patient
// @route   POST /api/reports/generate
// @access  Private (Doctor)
const generateReport = async (req, res) => {
    // In Task 2, this will receive actual diagnosis and prescription data to generate a PDF.
    const { appointmentId, patientId, diagnosis, prescription } = req.body;

    try {
        // 1. Verify doctor authorization
        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctorProfile) {
            return res.status(403).json({ message: 'Not authorized as a doctor.' });
        }

        // 2. Find the patient to get their email and name
        const patient = await Patient.findByPk(patientId, {
            include: [{ model: User, attributes: ['name', 'email'] }]
        });

        if (!patient || !patient.User) {
            return res.status(404).json({ message: 'Patient not found.' });
        }

        // 3. TODO (Task 2): Actual PDF Generation Logic Here
        console.log(`[REPORT] Generating PDF report for ${patient.User.name}...`);

        // Mocking the PDF generation and saving to cloud storage
        const mockReportUrl = `http://localhost:5000/api/reports/download/mock-report-${Date.now()}.pdf`;

        // 4. Send the Report Ready Email notification
        await sendReportReadyEmail(patient.User.email, patient.User.name, mockReportUrl);

        res.status(200).json({
            message: 'Report generated successfully and notification sent to the patient.',
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
