const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF report for a medical scan
 * @param {Object} scan - The scan record
 * @param {Object} report - The report record
 * @param {Object} doctor - Doctor information
 * @param {Object} patient - Patient information
 * @returns {Promise<string>} - Path to the generated PDF
 */
const generateReportPDF = (scan, report, doctor, patient) => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `report-${report.id}.pdf`;
            const filePath = path.join(__dirname, '../uploads/reports', fileName);

            // Ensure directory exists
            const reportsDir = path.join(__dirname, '../uploads/reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).text('MediFusion Vision - Medical Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Date: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.hr = (y) => doc.moveTo(50, y).lineTo(550, y).stroke();
            doc.hr(doc.y);
            doc.moveDown();

            // Patient & Doctor Info
            doc.fontSize(12).font('Helvetica-Bold').text('Patient Information:');
            doc.font('Helvetica').fontSize(10).text(`Name: ${patient.name || 'N/A'}`);
            doc.text(`Patient ID: ${patient.id || 'N/A'}`);
            doc.moveDown(0.5);

            doc.fontSize(12).font('Helvetica-Bold').text('Doctor Information:');
            doc.font('Helvetica').fontSize(10).text(`Doctor: ${doctor.name || 'N/A'}`);
            doc.text(`Specialization: ${doctor.specialization || 'Radiologist'}`);
            doc.moveDown();

            doc.hr(doc.y);
            doc.moveDown();

            // Scan Details
            doc.fontSize(14).font('Helvetica-Bold').text('Scan Details:');
            doc.font('Helvetica').fontSize(10).text(`Scan Type: ${scan.scan_type?.replace('_', ' ').toUpperCase()}`);
            doc.text(`Body Part: ${scan.body_part || 'N/A'}`);
            doc.text(`Facility: ${scan.facility_name || 'N/A'}`);
            doc.text(`Scan Date: ${scan.taken_date || new Date(scan.createdAt).toLocaleDateString()}`);
            doc.moveDown();

            // AI Findings
            doc.fontSize(14).font('Helvetica-Bold').text('AI Diagnostic Findings:');
            const aiPred = scan.ai_prediction || {};
            doc.font('Helvetica').fontSize(10).text(`AI Classification: ${aiPred.primary?.condition || 'Pending'}`);
            doc.text(`Confidence: ${((aiPred.primary?.confidence || 0) * 100).toFixed(1)}%`);
            if (scan.ai_explanation) {
                doc.text(`AI Inference Details: ${scan.ai_explanation}`, { align: 'justify' });
            }
            doc.moveDown();

            // Doctor's Interpretation
            doc.fontSize(14).font('Helvetica-Bold').text("Physician's Impression & Diagnosis:", { color: '#2563eb' });
            doc.font('Helvetica-Bold').fontSize(11).text(`Diagnosis: ${report.diagnosis}`);
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10).text(`Clinical Notes: ${report.doctor_notes || 'No additional notes provided.'}`, { align: 'justify' });
            doc.moveDown();

            doc.hr(doc.y);
            doc.moveDown();

            // Footer
            doc.fontSize(8).text('Disclaimer: This AI-assisted report is for diagnostic support only. Final clinical decisions rest with the attending physician.', { align: 'center', italic: true });
            doc.text('MediFusion Vision System - Automated Digital Pathology & Radiology Analysis', { align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
            stream.on('error', (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateReportPDF };
