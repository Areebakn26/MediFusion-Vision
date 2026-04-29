const { Scan, Report, Patient, User, Doctor } = require('../models');
const { createNotification } = require('../utils/notificationHelper');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');

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

        // Notify the patient that their report is ready
        const patientProfile = await Patient.findByPk(scan.patient_id, {
            include: [{ model: User, attributes: ['id', 'name'] }]
        });
        if (patientProfile && patientProfile.User) {
            await createNotification(
                patientProfile.User.id,
                'report_ready',
                'Your Report is Ready',
                'Your medical scan report has been reviewed and finalized by the doctor. Tap to view your results.',
                { scanId: scan.id, reportId: report.id }
            );
        }

        res.status(201).json(report);
    } catch (error) {
        console.error("Create Report Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Run AI Analysis on Scan (Mock)
// @route   POST /api/scans/:id/analyze
// @access  Private (Doctor)
const runAIAnalysis = async (req, res) => {
    const scanId = req.params.id;

    try {
        const scan = await Scan.findByPk(scanId, {
            include: [{ model: Patient, include: [{ model: User, attributes: ['name'] }] }]
        });

        if (!scan) {
            return res.status(404).json({ message: 'Scan not found' });
        }

        // Mock AI Analysis - In production, this would call the AI microservice
        const mockAnalysis = generateMockAIAnalysis(scan.scan_type);

        // Update scan with AI results
        scan.ai_prediction = mockAnalysis.predictions;
        scan.ai_explanation = mockAnalysis.explanation;
        scan.ai_heatmap_url = mockAnalysis.heatmapUrl;
        scan.status = 'analyzed';
        scan.processed_at = new Date();
        await scan.save();

        res.json({
            success: true,
            scanId: scan.id,
            analysis: mockAnalysis,
            message: 'AI analysis completed successfully'
        });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mock AI Analysis Generator
function generateMockAIAnalysis(scanType) {
    const analyses = {
        mri_brain: {
            predictions: {
                primary: { condition: 'No significant abnormality', confidence: 0.92 },
                differential: [
                    { condition: 'Normal brain MRI', confidence: 0.92 },
                    { condition: 'Minor age-related changes', confidence: 0.06 },
                    { condition: 'Artifact', confidence: 0.02 }
                ]
            },
            findings: [
                'Brain parenchyma appears normal',
                'No mass effect or midline shift',
                'Ventricles are normal in size',
                'No acute infarct or hemorrhage',
                'No abnormal enhancement'
            ],
            explanation: 'The AI model analyzed the brain MRI using deep learning algorithms trained on over 100,000 brain scans. Key anatomical structures were identified and compared against normal parameters.',
            heatmapUrl: null,
            severity: 'Normal',
            urgency: 'Routine'
        },
        retinal: {
            predictions: {
                primary: { condition: 'Mild Diabetic Retinopathy', confidence: 0.78 },
                differential: [
                    { condition: 'Mild Diabetic Retinopathy', confidence: 0.78 },
                    { condition: 'Normal Retina', confidence: 0.15 },
                    { condition: 'Moderate DR', confidence: 0.07 }
                ]
            },
            findings: [
                'Microaneurysms detected in temporal quadrant',
                'No hard exudates observed',
                'Optic disc appears normal',
                'Macula shows no edema',
                'Retinal vessels show mild tortuosity'
            ],
            explanation: 'The retinal scan was analyzed using a convolutional neural network specialized in detecting diabetic retinopathy markers. Attention maps highlight areas of concern.',
            heatmapUrl: null,
            severity: 'Mild',
            urgency: 'Follow-up in 6 months'
        },
        xray: {
            predictions: {
                primary: { condition: 'Possible Pneumonia', confidence: 0.85 },
                differential: [
                    { condition: 'Bacterial Pneumonia', confidence: 0.85 },
                    { condition: 'Viral Pneumonia', confidence: 0.10 },
                    { condition: 'Normal', confidence: 0.05 }
                ]
            },
            findings: [
                'Opacity observed in right lower lobe',
                'No pleural effusion',
                'Heart size within normal limits',
                'No pneumothorax',
                'Bony structures intact'
            ],
            explanation: 'Chest X-ray analysis performed using a ResNet-based model trained on NIH ChestX-ray14 dataset. Areas of opacity highlighted for clinical correlation.',
            heatmapUrl: null,
            severity: 'Moderate',
            urgency: 'Clinical correlation recommended'
        },
        ct_scan: {
            predictions: {
                primary: { condition: 'No acute findings', confidence: 0.88 },
                differential: [
                    { condition: 'Normal CT', confidence: 0.88 },
                    { condition: 'Minor degenerative changes', confidence: 0.10 },
                    { condition: 'Other', confidence: 0.02 }
                ]
            },
            findings: [
                'No acute intracranial hemorrhage',
                'Brain parenchyma appears normal',
                'No mass lesion identified',
                'Sinuses are clear',
                'Orbits appear normal'
            ],
            explanation: 'CT scan analyzed using 3D convolutional neural network for volumetric assessment. All slices reviewed for abnormalities.',
            heatmapUrl: null,
            severity: 'Normal',
            urgency: 'Routine'
        }
    };

    return analyses[scanType] || {
        predictions: {
            primary: { condition: 'Analysis Complete', confidence: 0.75 },
            differential: [{ condition: 'Requires specialist review', confidence: 0.75 }]
        },
        findings: ['Scan processed successfully', 'Awaiting specialist interpretation'],
        explanation: 'General analysis completed. Specialist review recommended for detailed interpretation.',
        heatmapUrl: null,
        severity: 'Unknown',
        urgency: 'Specialist review'
    };
}

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
    uploadExternalScan,
    uploadInternalScan,
    getAIAnalysis
};
