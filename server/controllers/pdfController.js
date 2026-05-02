const { Scan, Report, Patient, User, Doctor } = require('../models');
const { generateReportPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

// @desc    Generate PDF Report
// @route   POST /api/scans/:id/report/pdf
// @access  Private (Doctor, Patient)
const generatePDFReport = async (req, res) => {
    const scanId = req.params.id;

    try {
        const scan = await Scan.findByPk(scanId, {
            include: [{ model: Patient, include: [User] }]
        });

        if (!scan) return res.status(404).json({ message: 'Scan not found' });

        const report = await Report.findOne({ where: { scan_id: scanId } });
        if (!report) return res.status(404).json({ message: 'Report not finalized yet' });

        const doctorProfile = req.user.role === 'doctor'
            ? await Doctor.findOne({ where: { user_id: req.user.id }, include: [{ model: User }] })
            : null;

        // Generate PDF using the professional generator
        const pdfUrl = await generateReportPDF(scan, report, doctorProfile, scan.Patient.User);
        
        // Construct full path
        const filePath = path.join(__dirname, '..', pdfUrl);
        
        if (!fs.existsSync(filePath)) {
            return res.status(500).json({ message: 'PDF file not found after generation' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="MediFusion_Report_${scan.id.substring(0,8)}.pdf"`);
        
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'PDF generation failed', error: error.message });
    }
};

module.exports = { generatePDFReport };