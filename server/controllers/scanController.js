const { Scan, Report, Patient, User, Doctor } = require('../models');
const axios = require('axios'); //added for model integration process
const fs = require('fs'); //added for model integration process
const FormData = require('form-data'); //added for model integration process
const { generatePDFReport } = require('./pdfController');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'server/uploads/');
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
    const filetypes = /jpeg|jpg|png|pdf|dicom|dcm|tiff|tif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'application/dicom';

    if (mimetype || extname) {
        return cb(null, true);
    } else {
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
                include: [{
                    model: Report,
                    required: false
                }],
                order: [['createdAt', 'DESC']]
            });
        } else if (req.user.role === 'doctor') {
            const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
            
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

        // Format response for frontend compatibility
        const formattedScans = scans.map(scan => {
            const plainScan = scan.get({ plain: true });
            return {
                ...plainScan,
                _id: plainScan.id, // Frontend compatibility
                patient: plainScan.Patient ? {
                    ...plainScan.Patient,
                    name: plainScan.Patient.User?.name,
                    email: plainScan.Patient.User?.email
                } : null,
                scanType: plainScan.scan_type,
                filePath: plainScan.file_url,
                aiAnalysis: plainScan.ai_prediction
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
    const { diagnosis, notes, aiFindings } = req.body;
    const scanId = req.params.id;

    try {
        const scan = await Scan.findByPk(scanId);
        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Get doctor profile
        const doctorProfile = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor profile not found' });
        }

        // Check if report already exists
        let report = await Report.findOne({ where: { scan_id: scanId } });

        if (report) {
            // Update existing report
            report.diagnosis = diagnosis;
            report.doctor_notes = notes;
            report.ai_findings = aiFindings;
            report.finalized = true;
            report.finalized_at = new Date();
            await report.save();
        } else {
            // Create new report
            report = await Report.create({
                scan_id: scanId,
                doctor_id: doctorProfile.id,
                patient_id: scan.patient_id,
                diagnosis,
                doctor_notes: notes,
                ai_findings: aiFindings,
                finalized: true,
                finalized_at: new Date()
            });
        }

        // Update scan status
        scan.status = 'verified';
        scan.doctor_comments = notes;
        await scan.save();

        res.status(201).json(report);
    } catch (error) {
        console.error("Create Report Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════
// ADD YE LINE — file ke bilkul upar, existing requires ke saath
// ══════════════════════════════════════════════════════════════
// const axios = require('axios');
// const fs = require('fs');
// const FormData = require('form-data');
//
// NOTE: Upar wali 3 lines scanController.js ke TOP pe add karni hain
// existing requires ke saath jaise:
// const { Scan, Report, Patient, User, Doctor } = require('../models');
// ══════════════════════════════════════════════════════════════


// @desc    Run AI Analysis on Scan (Real Flask API)
// @route   POST /api/scans/:id/analyze
// @access  Private (Doctor)
const runAIAnalysis = async (req, res) => {
    const scanId = req.params.id;

    try {
        // 1. Scan database se lo
        const scan = await Scan.findByPk(scanId, {
            include: [{ model: Patient, include: [{ model: User, attributes: ['name'] }] }]
        });

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // 2. Scan file ka path banao
        const scanFilePath = path.join(__dirname, '..', scan.file_url);

        if (!fs.existsSync(scanFilePath)) {
            return res.status(404).json({ message: 'Scan file not found on server' });
        }

        // 3. Flask API ko image bhejo
        const formData = new FormData();
        formData.append('image', fs.createReadStream(scanFilePath));

        const flaskResponse = await axios.post(
            'http://127.0.0.1:5002/api/analyze',
            formData,
            {
                headers: { ...formData.getHeaders() },
                timeout: 60000  // 60 seconds — model load hone ka time
            }
        );

        const aiResult = flaskResponse.data;

        if (!aiResult.success) {
            return res.status(500).json({ message: 'AI analysis failed', error: aiResult.error });
        }

        // 4. Results database mein save karo
        scan.ai_prediction = {
            class_name:  aiResult.prediction.class_name,
            class_idx:   aiResult.prediction.class_idx,
            confidence:  aiResult.prediction.confidence,
            all_probs:   aiResult.prediction.all_probs,
        };

        scan.ai_explanation = {
            what_model_sees:  aiResult.explanation.what_model_sees,
            why_prediction:   aiResult.explanation.why_prediction,
            red_area_meaning: aiResult.explanation.red_area_meaning,
            clinical_note:    aiResult.explanation.clinical_note,
            validity_check:   aiResult.explanation.validity_check,
            confidence_text:  aiResult.explanation.confidence_text,
            eye_side:         aiResult.explanation.eye_side,
            regions:          aiResult.regions,
            analysis_meta:    aiResult.analysis_meta,
        };

        // Heatmap images base64 mein save karo
        scan.ai_heatmap_url = aiResult.images.overlay;   // base64 overlay image

        scan.status       = 'analyzed';
        scan.processed_at = new Date();
        await scan.save();

        // 5. Frontend ko response bhejo
        res.json({
            success:     true,
            scanId:      scan.id,
            prediction:  aiResult.prediction,
            images:      aiResult.images,
            explanation: aiResult.explanation,
            regions:     aiResult.regions,
            analysis_meta: aiResult.analysis_meta,
            message:     'AI analysis completed successfully'
        });

    } catch (error) {
        // Flask API down hai ya timeout
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                message: 'AI service unavailable. Please ensure the AI server is running.',
                error: 'Flask API not reachable at http://127.0.0.1:5002'
            });
        }
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                message: 'AI analysis timed out. Please try again.',
                error: 'Request timeout'
            });
        }
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
        const scan = await Scan.findByPk(scanId, {
            include: [{ model: Patient, include: [{ model: User, attributes: ['name'] }] }]
        });

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        const scanFilePath = path.join(__dirname, '..', scan.file_url);
        if (!fs.existsSync(scanFilePath)) {
            return res.status(404).json({ message: 'Scan file not found on server' });
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(scanFilePath));

        const flaskResponse = await axios.post(
            'http://127.0.0.1:5003/api/analyze',
            formData,
            {
                headers: { ...formData.getHeaders() },
                timeout: 120000  // 2 minutes — 2 models run hote hain
            }
        );

        const aiResult = flaskResponse.data;

        if (!aiResult.success) {
            return res.status(500).json({ message: 'Brain AI analysis failed', error: aiResult.error });
        }

        // Save results to DB
        scan.ai_prediction = {
            scan_type:    'brain_mri',
            tumor:        aiResult.tumor,
            alzheimer:    aiResult.alzheimer,
            clinical_summary: aiResult.clinical_summary,
            patient_summary:  aiResult.patient_summary,
            model_version:    aiResult.model_version,
        };

        scan.ai_explanation = {
            tumor_finding:    aiResult.tumor.clinical_finding,
            alz_finding:      aiResult.alzheimer.clinical_finding,
            tumor_xai:        aiResult.tumor.xai_reasoning,
            alz_xai:          aiResult.alzheimer.xai_reasoning,
            clinical_note:    aiResult.clinical_summary.clinical_note,
            overall_status:   aiResult.clinical_summary.overall_status,
            priority:         aiResult.clinical_summary.priority,
        };

        scan.ai_heatmap_url = aiResult.images.tumor_heatmap || aiResult.images.alz_heatmap || null;
        scan.status         = 'analyzed';
        scan.processed_at   = new Date();
        await scan.save();

        res.json({
            success:          true,
            scanId:           scan.id,
            scan_type:        'brain_mri',
            images:           aiResult.images,
            tumor:            aiResult.tumor,
            alzheimer:        aiResult.alzheimer,
            clinical_summary: aiResult.clinical_summary,
            patient_summary:  aiResult.patient_summary,
            message:          'Brain AI analysis completed successfully'
        });

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                message: 'Brain AI service unavailable. Please ensure the Brain AI server is running.',
                error: 'Flask API not reachable at http://127.0.0.1:5003'
            });
        }
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                message: 'Brain AI analysis timed out. Please try again.',
                error: 'Request timeout'
            });
        }
        console.error("Brain AI Analysis Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Upload External Scan (Patient)
// @route   POST /api/scans/external
// @access  Private (Patient)
const uploadExternalScan = async (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ message: err.message || err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const { scanType, bodyPart, takenDate, facilityName, notes } = req.body;
        const filePath = req.file.path;

        try {
            const fs = require('fs').promises;

            // Get Patient Profile
            const patientProfile = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patientProfile) {
                await fs.unlink(filePath).catch(() => {});
                return res.status(404).json({ message: 'Patient profile not found.' });
            }

            // Optional: Run validations if imageValidator exists
            let validationResult = { valid: true, warnings: [] };
            try {
                const { validateFileType, validateImageQuality, validateScanAuthenticity, extractMetadata } = require('../utils/imageValidator');
                const buffer = await fs.readFile(filePath);
                
                const typeValidation = await validateFileType(buffer);
                if (!typeValidation.valid) {
                    await fs.unlink(filePath);
                    return res.status(400).json({ message: typeValidation.message });
                }

                const qualityValidation = await validateImageQuality(filePath);
                const authenticityValidation = await validateScanAuthenticity(filePath, scanType);
                const metadata = await extractMetadata(filePath);

                validationResult = {
                    valid: true,
                    quality: qualityValidation,
                    authenticity: authenticityValidation,
                    metadata
                };
            } catch (validationError) {
                console.log('Validation utilities not available, skipping validation');
            }

            // Create Scan Record
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
                image_dimensions: validationResult.quality?.dimensions,
                quality_score: validationResult.quality?.qualityScore,
                validation_status: validationResult.authenticity?.isAuthentic ? 'validated' : 'pending',
                is_authentic: validationResult.authenticity?.isAuthentic ?? true,
                metadata: validationResult.metadata || {},
                notes: notes,
                status: 'pending'
            });

            res.status(201).json({
                message: 'Scan uploaded successfully',
                scan,
                validation: {
                    requiresManualReview: validationResult.authenticity?.requiresManualReview || false,
                    warnings: validationResult.authenticity?.warnings || []
                }
            });
        } catch (error) {
            console.error("Upload External Scan Error:", error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
};

// @desc    Upload Internal Scan (Admin/Hospital)
// @route   POST /api/scans/internal
// @access  Private (Admin)
const uploadInternalScan = async (req, res) => {
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
            // Find patient by various identifiers
            let patientProfile;
            
            // Try as UUID first
            if (patientId && patientId.includes('-')) {
                patientProfile = await Patient.findOne({ where: { user_id: patientId } });
                if (!patientProfile) {
                    patientProfile = await Patient.findByPk(patientId);
                }
            }
            
            // Try by email or CNIC
            if (!patientProfile && patientId) {
                const user = await User.findOne({ 
                    where: { 
                        [Op.or]: [
                            { email: patientId },
                        ]
                    } 
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

            // Internal scans are auto-validated (trusted source)
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

            console.log(`[NOTIFICATION] New internal scan uploaded for patient ${patientProfile.id}`);

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
// @route   GET /api/scans/:id/analysis
// @access  Private
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
    generatePDFReport
};
