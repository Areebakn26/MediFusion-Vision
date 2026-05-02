const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a professional PDF report for a medical scan
 * @param {Object} scan - The scan record
 * @param {Object} report - The report record
 * @param {Object} doctor - Doctor information (Doctor model instance)
 * @param {Object} patient - Patient information (User model instance)
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

            // --- Header ---
            doc.fillColor('#0d9488').fontSize(24).font('Helvetica-Bold').text('MediFusion Vision', { align: 'left' });
            doc.fillColor('#64748b').fontSize(12).font('Helvetica').text('Advanced Diagnostic Imaging Center', { align: 'left' });
            doc.moveDown(0.5);
            doc.fontSize(16).fillColor('#1e293b').text('DIAGNOSTIC REPORT', { align: 'center', characterSpacing: 1 });
            
            doc.moveDown(1);
            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // --- Patient & Report Meta ---
            const metaY = doc.y;
            doc.fontSize(10).fillColor('#64748b').text('PATIENT NAME', 50, metaY);
            doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(patient.name || 'N/A', 50, metaY + 15);

            doc.fontSize(10).fillColor('#64748b').font('Helvetica').text('REPORT DATE', 250, metaY);
            doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(new Date().toLocaleDateString(), 250, metaY + 15);

            doc.fontSize(10).fillColor('#64748b').font('Helvetica').text('REPORT ID', 400, metaY);
            doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(report.id.substring(0, 8).toUpperCase(), 400, metaY + 15);

            doc.moveDown(3);

            // --- Examination Details ---
            doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text('EXAMINATION DETAILS');
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#1e293b').font('Helvetica-Bold').text('Type: ', { continued: true }).font('Helvetica').text(scan.scan_type?.replace('_', ' ').toUpperCase());
            doc.font('Helvetica-Bold').text('Body Part: ', { continued: true }).font('Helvetica').text(scan.body_part || 'N/A');
            doc.font('Helvetica-Bold').text('Facility: ', { continued: true }).font('Helvetica').text(scan.facility_name || 'MediFusion Clinic');
            
            doc.moveDown(1.5);

            // --- Clinical History ---
            doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text('CLINICAL HISTORY');
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#334155').font('Helvetica').text(scan.notes || 'No clinical history provided.', { align: 'justify' });

            doc.moveDown(1.5);

            // --- Findings ---
            doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text('PHYSICIAN FINDINGS');
            doc.moveDown(0.5);
            
            const cleanNotes = (text) => {
                if (!text) return 'No specific findings documented.';
                // Strip out legacy technical AI JSON strings if they were accidentally saved into notes
                return text.replace(/AI Inference Details: \{[\s\S]*?\}/g, '').trim() || 'Findings verified by physician.';
            };

            doc.fontSize(10).fillColor('#334155').font('Helvetica').text(cleanNotes(report.doctor_notes), { align: 'justify', lineGap: 2 });

            doc.moveDown(1.5);

            // --- Impression / Conclusion ---
            doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text('IMPRESSION / CONCLUSION');
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text(report.diagnosis || 'Unspecified Diagnosis');

            doc.moveDown(1.5);

            // --- Patient Friendly Summary ---
            if (report.report_patient_friendly) {
                doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text('PATIENT-FRIENDLY SUMMARY');
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Oblique').text(report.report_patient_friendly, { align: 'justify' });
                doc.moveDown(1.5);
            }

            // --- Recommendations ---
            doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text('RECOMMENDATIONS');
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#334155').font('Helvetica').text(report.recommendations || 'Please consult with your primary care physician for follow-up and management.', { align: 'justify' });

            doc.moveDown(3);

            // --- Sign-off ---
            doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(350, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(`Dr. ${doctor.User?.name || 'Authorized Physician'}`, 350, doc.y, { align: 'left' });
            doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(`Specialization: ${doctor.specialization || 'N/A'}`, 350, doc.y);
            doc.fontSize(9).fillColor('#64748b').text(`License/PMDC: ${doctor.pmdc_number || 'N/A'}`, 350, doc.y);
            doc.moveDown(0.5);
            doc.fillColor('#10b981').fontSize(8).font('Helvetica-Bold').text('VERIFIED BY LICENSED PHYSICIAN', 350, doc.y);

            // --- Footer ---
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                doc.fontSize(8).fillColor('#94a3b8').text(
                    'This report is generated by MediFusion Vision. For verification or inquiries, contact support@medifusion.com.',
                    50, 750, { align: 'center' }
                );
            }

            doc.end();

            stream.on('finish', () => resolve(`/uploads/reports/${fileName}`));
            stream.on('error', (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateReportPDF };
