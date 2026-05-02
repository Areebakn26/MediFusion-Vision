const { Scan, Report, Patient, User, Doctor, AIFeedback, Appointment, Notification } = require('../models');
const axios = require('axios');
const FormData = require('form-data');
const { generateReportPDF } = require('../utils/pdfGenerator');
const { sendReportReadyEmail } = require('../utils/emailService');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const fs = require('fs');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50000000 }, // 50MB limit for medical scans
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('scan');

// Check File Type
function checkFileType(file, cb) {
    console.log(`[UPLOAD] checking file: ${file.originalname}, mime: ${file.mimetype}`);
    const filetypes = /jpeg|jpg|png|pdf|dicom|dcm|tiff|tif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/dicom';

    if (mimetype || extname) {
        return cb(null, true);
    } else {
        console.warn(`[UPLOAD] File type rejected: ${file.originalname}, ${file.mimetype}`);
        cb('Error: Medical images only (JPEG, PNG, TIFF, DICOM)!');
    }
}

// @desc    Upload a scan
// @route   POST /api/scans/upload
// @access  Private (Patient)
const uploadScan = (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message || err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { type, notes, bodyPart, takenDate, facilityName } = req.body;

        try {
            // Get Patient Profile
            const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patientProfile) {
                return res.status(404).json({ message: 'Patient profile not found.' });
            }

            const scan = await Scan.create({
                patient_id: patientProfile.id,
                scan_source: 'external',
                scan_type: type || 'other',
                file_url: `/uploads/${req.file.filename}`,
                uploaded_by: 'patient',
                body_part: bodyPart,
                taken_date: takenDate,
                facility_name: facilityName,
                file_format: req.file.mimetype.split('/')[1] || path.extname(req.file.originalname).slice(1),
                file_size: req.file.size,
                notes: notes,
                status: 'pending',
                validation_status: 'pending'
            });

            res.status(201).json(scan);

            // Notify Doctors who have appointments with this patient
            try {
                const appointments = await Appointment.findAll({
                    where: { 
                        patient_id: patientProfile.id,
                        status: 'scheduled'
                    },
                    include: [{ model: Doctor, include: [User] }]
                });

                for (const appt of appointments) {
                    await Notification.create({
                        user_id: appt.Doctor.User.id,
                        title: 'New Scan Uploaded',
                        message: `Patient ${req.user.name} has uploaded a new scan: ${scan.scan_type}.`,
                        type: 'scan_uploaded',
                        link: `/doctor/diagnostic/${scan.id}`
                    });
                }
            } catch (notifyError) {
                console.error("Scan Upload Notification Error:", notifyError);
            }
        } catch (error) {
            console.error("Upload Scan Error:", error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
};

// @desc    Get all scans
// @route   GET /api/scans
// @access  Private
const getScans = async (req, res) => {
    try {
        let scans;
        if (req.user.role === 'patient') {
            const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patientProfile) return res.json([]);

            scans = await Scan.findAll({
                where: { patient_id: patientProfile.id },
                include: [
                    { model: Report, required: false },
                    {
                        model: Doctor,
                        required: false,
                        include: [{ model: User, attributes: ['name'] }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

            // Option B: Restricted Access
            const appts = await Appointment.findAll({
                where: { doctor_id: doctorProfile.id },
                attributes: ['patient_id']
            });
            const patientIds = Array.from(new Set(appts.map(a => a.patient_id)));

            scans = await Scan.findAll({
                where: {
                    [Op.or]: [
                        { doctor_id: doctorProfile.id },
                        { patient_id: { [Op.in]: patientIds } }
                    ]
                },
                include: [
                    {
                        model: Patient,
                        include: [{ model: User, attributes: ['name', 'email'] }]
                    },
                    {
                        model: Report,
                        required: false
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Admin
            scans = await Scan.findAll({
                include: [
                    {
                        model: Patient,
                        include: [{ model: User, attributes: ['name', 'email'] }]
                    },
                    {
                        model: Report,
                        required: false
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        const formattedScans = scans.map(scan => {
            const plainScan = scan.get({ plain: true });
            return {
                ...plainScan,
                _id: plainScan.id,
                patient: plainScan.Patient ? {
                    ...plainScan.Patient,
                    name: plainScan.Patient.User?.name,
                    email: plainScan.Patient.User?.email
                } : null,
                scanType: plainScan.scan_type,
                filePath: plainScan.file_url,
                aiAnalysis: plainScan.ai_prediction,
                doctorName: plainScan.Doctor?.User?.name ? `Dr. ${plainScan.Doctor.User.name}` : null
            };
        });

        res.json(formattedScans);
    } catch (error) {
        console.error("Get Scans Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single scan
// @route   GET /api/scans/:id
// @access  Private
const getScanById = async (req, res) => {
    try {
        const scan = await Scan.findByPk(req.params.id, {
            include: [
                {
                    model: Patient,
                    include: [{ model: User, attributes: ['name', 'email'] }]
                },
                {
                    model: Report,
                    include: [{ model: Doctor, include: [{ model: User, attributes: ['name'] }] }]
                }
            ]
        });

        if (scan) {
            // Access Control (Option B)
            if (req.user.role === 'patient') {
                const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
                if (scan.patient_id !== patientProfile.id) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            } else if (req.user.role === 'doctor') {
                const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
                if (!doctorProfile) return res.status(403).json({ message: 'Doctor profile not found' });

                const hasAppt = await Appointment.findOne({
                    where: {
                        doctor_id: doctorProfile.id,
                        patient_id: scan.patient_id
                    }
                });

                if (scan.doctor_id !== doctorProfile.id && !hasAppt) {
                    return res.status(403).json({ message: 'Access denied. You do not have an appointment with this patient.' });
                }
            }

            const plainScan = scan.get({ plain: true });
            res.json({
                ...plainScan,
                _id: plainScan.id,
                patient: plainScan.Patient ? {
                    ...plainScan.Patient,
                    name: plainScan.Patient.User?.name
                } : null,
                scanType: plainScan.scan_type,
                filePath: plainScan.file_url,
                aiAnalysis: plainScan.ai_prediction
            });
        } else {
            res.status(404).json({ message: 'Scan not found' });
        }
    } catch (error) {
        console.error("Get Scan By ID Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create Report for Scan
// @route   POST /api/scans/:id/report
// @access  Private (Doctor)
const createReport = async (req, res) => {
    const { diagnosis, notes, aiFindings, report_patient_friendly, recommendations } = req.body;
    const scanId = req.params.id;

    try {
        const scan = await Scan.findByPk(scanId);
        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        let report = await Report.findOne({ where: { scan_id: scanId } });

        if (report) {
            report.diagnosis = diagnosis;
            report.doctor_notes = notes;
            report.ai_findings = aiFindings;
            report.report_patient_friendly = report_patient_friendly;
            report.recommendations = recommendations;
            report.finalized = true;
            report.finalized_at = new Date();
            await report.save();
        } else {
            report = await Report.create({
                scan_id: scanId,
                doctor_id: doctorProfile.id,
                patient_id: scan.patient_id,
                diagnosis,
                doctor_notes: notes,
                ai_findings: aiFindings,
                report_patient_friendly,
                recommendations,
                finalized: true,
                finalized_at: new Date()
            });
        }

        scan.status = 'verified';
        scan.doctor_comments = notes;
        await scan.save();

        if (report.finalized) {
            try {
                const patient = await Patient.findByPk(scan.patient_id, {
                    include: [{ model: User, attributes: ['name', 'email'] }]
                });

                const pdfPath = await generateReportPDF(scan, report, doctorProfile, patient.User);

                report.final_report = pdfPath;
                await report.save();

                const downloadLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}${pdfPath}`;
                await sendReportReadyEmail(patient.User.email, patient.User.name, downloadLink);

                // In-app Notification for Patient
                await Notification.create({
                    user_id: patient.User.id,
                    title: 'Medical Report Ready',
                    message: `Your diagnostic report for ${scan.scan_type} has been finalized by Dr. ${doctorProfile.User.name}.`,
                    type: 'report_ready',
                    link: `/patient/scans/${scan.id}`
                });

                console.log(`[REPORT] PDF generated and notification sent for report ${report.id}`);
            } catch (notifyError) {
                console.error("PDF/Notification Error:", notifyError);
            }
        }

        res.status(201).json(report);
    } catch (error) {
        console.error("Create Report Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Run AI Analysis on Scan (Real Flask API - Retinal)
// @route   POST /api/scans/:id/analyze
// @access  Private (Doctor)
const runAIAnalysis = async (req, res) => {
    const scanId = req.params.id;

    try {
        const scan = await Scan.findByPk(scanId);

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Access Control (Option B)
        if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile) return res.status(403).json({ message: 'Doctor profile not found' });

            const hasAppt = await Appointment.findOne({
                where: {
                    doctor_id: doctorProfile.id,
                    patient_id: scan.patient_id
                }
            });

            if (scan.doctor_id !== doctorProfile.id && !hasAppt) {
                return res.status(403).json({ message: 'Access denied. You do not have an appointment with this patient.' });
            }
        }

        const scanFilePath = path.join(__dirname, '..', scan.file_url);

        if (!fs.existsSync(scanFilePath)) {
            return res.status(404).json({ message: 'Scan file not found on server' });
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(scanFilePath));

        try {
            const flaskResponse = await axios.post(
                'http://127.0.0.1:5002/api/analyze',
                formData,
                {
                    headers: { ...formData.getHeaders() },
                    timeout: 60000
                }
            );

            const aiResult = flaskResponse.data;

            if (!aiResult.success) {
                return res.status(500).json({ message: 'AI analysis failed', error: aiResult.error });
            }

            scan.ai_prediction = {
                class_name: aiResult.prediction.class_name,
                class_idx: aiResult.prediction.class_idx,
                confidence: aiResult.prediction.confidence,
                all_probs: aiResult.prediction.all_probs,
            };

            scan.ai_explanation = {
                what_model_sees: aiResult.explanation.what_model_sees,
                why_prediction: aiResult.explanation.why_prediction,
                red_area_meaning: aiResult.explanation.red_area_meaning,
                clinical_note: aiResult.explanation.clinical_note,
                validity_check: aiResult.explanation.validity_check,
                confidence_text: aiResult.explanation.confidence_text,
                eye_side: aiResult.explanation.eye_side,
                regions: aiResult.regions,
                analysis_meta: aiResult.analysis_meta,
            };

            scan.ai_heatmap_url = aiResult.images.overlay;
            scan.status = 'analyzed';
            scan.processed_at = new Date();
            await scan.save();

            res.json({
                success: true,
                scanId: scan.id,
                prediction: aiResult.prediction,
                images: aiResult.images,
                explanation: aiResult.explanation,
                regions: aiResult.regions,
                analysis_meta: aiResult.analysis_meta,
                message: 'AI analysis completed successfully'
            });
        } catch (aiError) {
            if (aiError.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    message: 'Retinal AI service unavailable. Please ensure the Retinal AI server is running.',
                    error: 'Flask API not reachable at http://127.0.0.1:5002'
                });
            }
            throw aiError;
        }

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Run AI Analysis on Brain Scan (Tumor + Alzheimer)
// @route   POST /api/scans/:id/analyze-brain
// @access  Private (Doctor)
const runBrainAIAnalysis = async (req, res) => {
    const scanId = req.params.id;

    try {
        const scan = await Scan.findByPk(scanId);

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Access Control (Option B)
        if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile) return res.status(403).json({ message: 'Doctor profile not found' });

            const hasAppt = await Appointment.findOne({
                where: {
                    doctor_id: doctorProfile.id,
                    patient_id: scan.patient_id
                }
            });

            if (scan.doctor_id !== doctorProfile.id && !hasAppt) {
                return res.status(403).json({ message: 'Access denied. You do not have an appointment with this patient.' });
            }
        }

        const scanFilePath = path.join(__dirname, '..', scan.file_url);
        if (!fs.existsSync(scanFilePath)) {
            return res.status(404).json({ message: 'Scan file not found on server' });
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(scanFilePath));

        try {
            const flaskResponse = await axios.post(
                'http://127.0.0.1:5003/api/analyze',
                formData,
                {
                    headers: { ...formData.getHeaders() },
                    timeout: 120000
                }
            );

            const aiResult = flaskResponse.data;

            if (!aiResult.success) {
                return res.status(500).json({ message: 'Brain AI analysis failed', error: aiResult.error });
            }

            scan.ai_prediction = {
                scan_type: 'brain_mri',
                tumor: aiResult.tumor,
                alzheimer: aiResult.alzheimer,
                clinical_summary: aiResult.clinical_summary,
                patient_summary: aiResult.patient_summary,
                model_version: aiResult.model_version,
            };

            scan.ai_explanation = {
                tumor_finding: aiResult.tumor.clinical_finding,
                alz_finding: aiResult.alzheimer.clinical_finding,
                tumor_xai: aiResult.tumor.xai_reasoning,
                alz_xai: aiResult.alzheimer.xai_reasoning,
                clinical_note: aiResult.clinical_summary.clinical_note,
                overall_status: aiResult.clinical_summary.overall_status,
                priority: aiResult.clinical_summary.priority,
            };

            scan.ai_heatmap_url = aiResult.images.tumor_heatmap || aiResult.images.alz_heatmap || null;
            scan.status = 'analyzed';
            scan.processed_at = new Date();
            await scan.save();

            res.json({
                success: true,
                scanId: scan.id,
                scan_type: 'brain_mri',
                images: aiResult.images,
                tumor: aiResult.tumor,
                alzheimer: aiResult.alzheimer,
                clinical_summary: aiResult.clinical_summary,
                patient_summary: aiResult.patient_summary,
                message: 'Brain AI analysis completed successfully'
            });
        } catch (aiError) {
            if (aiError.code === 'ECONNREFUSED') {
                return res.status(503).json({
                    message: 'Brain AI service unavailable. Please ensure the Brain AI server is running.',
                    error: 'Flask API not reachable at http://127.0.0.1:5003'
                });
            }
            throw aiError;
        }

    } catch (error) {
        console.error("Brain AI Analysis Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Provide feedback on AI analysis
// @route   POST /api/scans/:id/feedback
// @access  Private (Doctor/Admin)
const provideFeedback = async (req, res) => {
    const scanId = req.params.id;
    const { isCorrect, correctionDetails, reason } = req.body;

    try {
        const scan = await Scan.findByPk(scanId);
        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Access Control (Option B)
        if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile) return res.status(403).json({ message: 'Doctor profile not found' });

            const hasAppt = await Appointment.findOne({
                where: {
                    doctor_id: doctorProfile.id,
                    patient_id: scan.patient_id
                }
            });

            if (scan.doctor_id !== doctorProfile.id && !hasAppt) {
                return res.status(403).json({ message: 'Access denied. You do not have an appointment with this patient.' });
            }
        }

        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        const feedback = await AIFeedback.create({
            scan_id: scanId,
            doctor_id: doctorProfile.id,
            is_flagged: !isCorrect,
            correction_details: correctionDetails || reason,
            admin_review_status: 'pending'
        });

        if (!isCorrect) {
            scan.status = 'flagged';
            await scan.save();
        }

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedback
        });
    } catch (error) {
        console.error("Provide Feedback Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload External Scan (Patient)
const uploadExternalScan = (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error('[UPLOAD] Multer Error:', err);
            return res.status(400).json({ message: err.message || err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { scanType, bodyPart, takenDate, facilityName, notes } = req.body;
        const filePath = req.file.path;

        try {
            const fsPromises = require('fs').promises;

            const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patientProfile) {
                await fsPromises.unlink(filePath).catch(() => { });
                return res.status(404).json({ message: 'Patient profile not found.' });
            }

            const scan = await Scan.create({
                patient_id: patientProfile.id,
                scan_source: 'external',
                scan_type: scanType || 'other',
                file_url: `/uploads/${req.file.filename}`,
                uploaded_by: 'patient',
                body_part: bodyPart,
                taken_date: takenDate,
                facility_name: facilityName,
                file_format: req.file.mimetype.split('/')[1] || path.extname(req.file.originalname).slice(1),
                file_size: req.file.size,
                notes: notes,
                status: 'pending'
            });

            res.status(201).json({
                message: 'Scan uploaded successfully',
                scan
            });

            // Notify Doctors who have appointments with this patient
            try {
                const appointments = await Appointment.findAll({
                    where: { 
                        patient_id: patientProfile.id,
                        status: 'scheduled'
                    },
                    include: [{ model: Doctor, include: [User] }]
                });

                for (const appt of appointments) {
                    await Notification.create({
                        user_id: appt.Doctor.User.id,
                        title: 'New External Scan Uploaded',
                        message: `Patient ${req.user.name} has uploaded a new external scan: ${scan.scan_type}.`,
                        type: 'scan_uploaded',
                        link: `/doctor/diagnostic/${scan.id}`
                    });
                }
            } catch (notifyError) {
                console.error("Scan Upload Notification Error:", notifyError);
            }
        } catch (error) {
            console.error("Upload External Scan Error:", error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
};

// @desc    Upload Internal Scan (Admin/Hospital)
const uploadInternalScan = (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message || err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const {
            patientId,
            scanType,
            bodyPart,
            takenDate,
            facilityName,
            labTechnician,
            notes
        } = req.body;

        try {
            let patientProfile;

            if (patientId && patientId.includes('-')) {
                patientProfile = await Patient.findOne({ where: { user_id: patientId } });
                if (!patientProfile) {
                    patientProfile = await Patient.findByPk(patientId);
                }
            }

            if (!patientProfile && patientId) {
                const user = await User.findOne({
                    where: { email: patientId }
                });
                if (user) {
                    patientProfile = await Patient.findOne({ where: { user_id: user.id } });
                } else {
                    patientProfile = await Patient.findOne({ where: { cnic: patientId } });
                }
            }

            if (!patientProfile) {
                return res.status(404).json({ message: 'Patient not found' });
            }

            const scan = await Scan.create({
                patient_id: patientProfile.id,
                scan_source: 'internal',
                scan_type: scanType || 'other',
                file_url: `/uploads/${req.file.filename}`,
                uploaded_by: 'admin',
                body_part: bodyPart,
                taken_date: takenDate,
                facility_name: facilityName || 'MediFusion Hospital',
                lab_technician: labTechnician,
                file_format: req.file.mimetype.split('/')[1] || path.extname(req.file.originalname).slice(1),
                file_size: req.file.size,
                validation_status: 'validated',
                is_authentic: true,
                notes: notes,
                status: 'pending'
            });

            res.status(201).json({
                message: 'Internal scan uploaded successfully',
                scan
            });
        } catch (error) {
            console.error("Upload Internal Scan Error:", error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
};

// @desc    Get AI Analysis Results
const getAIAnalysis = async (req, res) => {
    try {
        const scan = await Scan.findByPk(req.params.id, {
            include: [
                { model: Patient, include: [{ model: User, attributes: ['name'] }] },
                { model: Report }
            ]
        });

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Access Control (Option B)
        if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            if (!doctorProfile) return res.status(403).json({ message: 'Doctor profile not found' });

            const hasAppt = await Appointment.findOne({
                where: {
                    doctor_id: doctorProfile.id,
                    patient_id: scan.patient_id
                }
            });

            if (scan.doctor_id !== doctorProfile.id && !hasAppt) {
                return res.status(403).json({ message: 'Access denied. You do not have an appointment with this patient.' });
            }
        }

        res.json({
            scanId: scan.id,
            scanType: scan.scan_type,
            status: scan.status,
            aiPrediction: scan.ai_prediction,
            aiExplanation: scan.ai_explanation,
            aiHeatmapUrl: scan.ai_heatmap_url,
            processedAt: scan.processed_at,
            report: scan.Reports?.[0] || null
        });
    } catch (error) {
        console.error("Get AI Analysis Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    uploadScan,
    getScans,
    getScanById,
    createReport,
    runAIAnalysis,
    runBrainAIAnalysis,
    uploadExternalScan,
    uploadInternalScan,
    getAIAnalysis,
    provideFeedback,
    generateReportPDF
};
