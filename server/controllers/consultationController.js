const { ChatLog, ConsultationNote, Prescription, User, Appointment, Patient, MedicalHistory } = require('../models');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { transcribeAudio, generateConsultationNotes } = require('../utils/aiNoteService');

const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'audio');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${req.params.appointmentId}-consult.webm`)
});

const audioUpload = multer({
    storage: audioStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/webm', 'video/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg', 'audio/x-m4a'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error(`Unsupported audio: ${file.mimetype}`));
    }
}).single('audio');

// @desc    Get chat history for an appointment
// @route   GET /api/consultation/:appointmentId/chat
// @access  Private (doctor, patient, admin)
const getChatHistory = async (req, res) => {
    try {
        const chatHistory = await ChatLog.findAll({
            where: { appointment_id: req.params.appointmentId },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'role'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        const formatted = chatHistory.map(chat => {
            const plain = chat.get({ plain: true });
            return {
                ...plain,
                _id: plain.id,
                sender: {
                    _id: plain.sender?.id,
                    name: plain.sender?.name,
                    role: plain.sender?.role
                }
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error("Get Chat History Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Send a chat message
// @route   POST /api/consultation/:appointmentId/chat
// @access  Private (doctor, patient)
const sendChatMessage = async (req, res) => {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });
    try {
        const chat = await ChatLog.create({
            appointment_id: req.params.appointmentId,
            sender_id: req.user.id,
            message: message.trim()
        });
        const populated = await ChatLog.findByPk(chat.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }]
        });
        const plain = populated.get({ plain: true });
        res.status(201).json({
            ...plain,
            _id: plain.id,
            sender: { _id: plain.sender?.id, name: plain.sender?.name, role: plain.sender?.role }
        });
    } catch (error) {
        console.error("Send Chat Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get consultation notes
// @route   GET /api/consultation/:appointmentId/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        const notes = await ConsultationNote.findAll({
            where: { appointment_id: req.params.appointmentId },
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'role'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Format for frontend compatibility
        const formatted = notes.map(note => {
            const plain = note.get({ plain: true });
            return {
                ...plain,
                _id: plain.id,
                author: {
                    _id: plain.author?.id,
                    name: plain.author?.name,
                    role: plain.author?.role
                }
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error("Get Notes Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a consultation note
// @route   POST /api/consultation/:appointmentId/notes
// @access  Private (Doctor)
const addNote = async (req, res) => {
    const { content, noteType, isPrivate } = req.body;
    
    try {
        // Verify appointment exists
        const appointment = await Appointment.findByPk(req.params.appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const note = await ConsultationNote.create({
            appointment_id: req.params.appointmentId,
            author_id: req.user.id,
            content,
            note_type: noteType || 'clinical',
            is_private: isPrivate || false
        });

        const populatedNote = await ConsultationNote.findByPk(note.id, {
            include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }]
        });

        const plain = populatedNote.get({ plain: true });
        res.status(201).json({
            ...plain,
            _id: plain.id,
            author: {
                _id: plain.author?.id,
                name: plain.author?.name,
                role: plain.author?.role
            }
        });
    } catch (error) {
        console.error("Add Note Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get prescription
// @route   GET /api/consultation/:appointmentId/prescription
// @access  Private
const getPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findOne({
            where: { appointment_id: req.params.appointmentId }
        });
        
        if (prescription) {
            const plain = prescription.get({ plain: true });
            res.json({
                ...plain,
                _id: plain.id
            });
        } else {
            res.json({ medications: [], _id: null });
        }
    } catch (error) {
        console.error("Get Prescription Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save prescription
// @route   POST /api/consultation/:appointmentId/prescription
// @access  Private (Doctor only)
const savePrescription = async (req, res) => {
    const { medications, diagnosis, instructions, followUpDate } = req.body;
    
    try {
        // Verify appointment exists and user is the doctor
        const appointment = await Appointment.findByPk(req.params.appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        let prescription = await Prescription.findOne({
            where: { appointment_id: req.params.appointmentId }
        });

        if (prescription) {
            // Update existing
            prescription.medications = medications;
            if (diagnosis) prescription.diagnosis = diagnosis;
            if (instructions) prescription.instructions = instructions;
            if (followUpDate) prescription.follow_up_date = followUpDate;
            await prescription.save();
        } else {
            // Create new
            prescription = await Prescription.create({
                appointment_id: req.params.appointmentId,
                medications,
                diagnosis,
                instructions,
                follow_up_date: followUpDate
            });
        }

        const plain = prescription.get({ plain: true });
        res.json({
            ...plain,
            _id: plain.id
        });
    } catch (error) {
        console.error("Save Prescription Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get full consultation summary
// @route   GET /api/consultation/:appointmentId/summary
// @access  Private
const getConsultationSummary = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.appointmentId, {
            include: [
                { model: Prescription },
                { model: ChatLog, include: [{ model: User, as: 'sender', attributes: ['name'] }] }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const notes = await ConsultationNote.findAll({
            where: { appointment_id: req.params.appointmentId },
            include: [{ model: User, as: 'author', attributes: ['name'] }]
        });

        res.json({
            appointment: appointment.get({ plain: true }),
            notes: notes.map(n => n.get({ plain: true })),
            chatCount: appointment.ChatLogs?.length || 0
        });
    } catch (error) {
        console.error("Get Consultation Summary Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient context (history, scans, previous notes)
// @route   GET /api/consultation/:appointmentId/patient-context
// @access  Private (Doctor)
const getPatientContext = async (req, res) => {
    try {
        const appointment = await Appointment.findByPk(req.params.appointmentId, {
            include: [
                {
                    model: Patient,
                    include: [
                        { model: User, attributes: ['name', 'email', 'phone'] },
                        { model: MedicalHistory }
                    ]
                }
            ]
        });

        if (!appointment || !appointment.Patient) {
            return res.status(404).json({ message: 'Appointment or patient not found' });
        }

        const patientId = appointment.Patient.id;
        const { Scan, Report, Doctor } = require('../models');

        // Fetch Scans with full AI data + Reports (GradCAM, findings, diagnosis)
        const scans = await Scan.findAll({
            where: { patient_id: patientId },
            include: [{
                model: Report,
                attributes: ['id', 'diagnosis', 'ai_findings', 'doctor_notes', 'recommendations', 'finalized', 'finalized_at']
            }],
            attributes: [
                'id', 'scan_type', 'file_url', 'ai_prediction', 'ai_heatmap_url',
                'ai_explanation', 'status', 'body_part', 'createdAt'
            ],
            order: [['createdAt', 'DESC']]
        });

        const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctor) return res.status(403).json({ message: 'Only registered doctors can access patient context' });

        // Fetch past completed consultations for this patient
        const pastConsultations = await Appointment.findAll({
            where: {
                patient_id: patientId,
                status: 'completed',
                id: { [require('sequelize').Op.ne]: req.params.appointmentId }
            },
            include: [
                {
                    model: ConsultationNote,
                    include: [{ model: User, as: 'author', attributes: ['name'] }]
                }
            ],
            order: [['date', 'DESC']]
        });

        const patientPlain = appointment.Patient.get({ plain: true });

        res.json({
            patient: {
                ...patientPlain,
                date_of_birth: patientPlain.date_of_birth,
                User: appointment.Patient.User.get({ plain: true })
            },
            medicalHistory: appointment.Patient.MedicalHistories,
            scans: scans.map(s => s.get({ plain: true })),
            pastConsultations: pastConsultations.map(a => a.get({ plain: true }))
        });
    } catch (error) {
        console.error("CRITICAL ERROR in getPatientContext:", error);
        res.status(500).json({ 
            message: 'Internal server error',
            details: error.message 
        });
    }
};

// @desc    Upload audio, transcribe with Whisper, generate structured notes with GPT
// @route   POST /api/consultation/:appointmentId/upload-audio
// @access  Private (Doctor)
const uploadAudioAndGenerateNotes = async (req, res) => {
    const { appointmentId } = req.params;

    await new Promise((resolve, reject) =>
        audioUpload(req, res, (err) => (err ? reject(err) : resolve()))
    );

    if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const filePath = req.file.path;

    try {
        const appointment = await Appointment.findByPk(appointmentId, {
            include: [{
                model: Patient,
                include: [
                    { model: User, attributes: ['name'] },
                    { model: MedicalHistory }
                ]
            }]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const p = appointment.Patient;
        const patientContext = p ? {
            name: p.User?.name,
            age: p.date_of_birth
                ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
            gender: p.gender,
            bloodGroup: p.blood_group,
            allergies: p.allergies,
            currentMedications: p.current_medications,
            medicalHistories: p.MedicalHistories?.map(h => ({
                condition: h.condition,
                type: h.type,
                status: h.status,
                notes: h.notes
            }))
        } : null;

        const transcript = await transcribeAudio(filePath);
        const notes = await generateConsultationNotes(transcript, patientContext);

        appointment.transcript = transcript;
        await appointment.save();

        return res.json({ transcript, notes });
    } catch (error) {
        console.error('Upload Audio Error:', error);
        return res.status(500).json({ message: error.message, fallbackEnabled: true });
    } finally {
        fs.unlink(filePath, () => {});
    }
};

// @desc    Save reviewed/edited AI notes to appointment
// @route   PATCH /api/consultation/:appointmentId/finalize-notes
// @access  Private (Doctor)
const finalizeNotes = async (req, res) => {
    const { appointmentId } = req.params;
    const { transcript, consultationSummary, doctorNotes } = req.body;

    try {
        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (transcript) appointment.transcript = transcript;
        if (consultationSummary) appointment.consultation_summary = JSON.stringify(consultationSummary);
        if (doctorNotes) appointment.doctor_notes = doctorNotes;
        if (appointment.status !== 'completed') appointment.status = 'completed';

        await appointment.save();
        return res.json({ message: 'Notes finalized successfully' });
    } catch (error) {
        console.error('Finalize Notes Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get patient-facing summary from consultation
// @route   GET /api/consultation/:appointmentId/patient-summary
// @access  Private
const getPatientSummary = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (req.user.role === 'patient') {
            const patient = await Patient.findOne({ where: { user_id: req.user.id } });
            if (!patient || appointment.patient_id !== patient.id) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        let parsed = null;
        if (appointment.consultation_summary) {
            try { parsed = JSON.parse(appointment.consultation_summary); } catch (_) {}
        }

        if (req.user.role === 'patient') {
            return res.json({ patientSummary: parsed?.patientSummary || null });
        }

        return res.json(parsed || {});
    } catch (error) {
        console.error('Get Patient Summary Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Generate AI notes from typed transcript (no audio needed — for testing/manual entry)
// @route   POST /api/consultation/:appointmentId/generate-notes-from-text
// @access  Private (Doctor)
const generateNotesFromText = async (req, res) => {
    const { appointmentId } = req.params;
    const { transcript } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ message: 'Transcript text is required' });

    try {
        const appointment = await Appointment.findByPk(appointmentId, {
            include: [{
                model: Patient,
                include: [
                    { model: User, attributes: ['name'] },
                    { model: MedicalHistory }
                ]
            }]
        });

        const p = appointment?.Patient;
        const patientContext = p ? {
            name: p.User?.name,
            age: p.date_of_birth
                ? Math.floor((Date.now() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
            gender: p.gender,
            bloodGroup: p.blood_group,
            allergies: p.allergies,
            currentMedications: p.current_medications,
            medicalHistories: p.MedicalHistories?.map(h => ({
                condition: h.condition, type: h.type, status: h.status, notes: h.notes
            }))
        } : null;

        const notes = await generateConsultationNotes(transcript.trim(), patientContext);
        return res.json({ transcript: transcript.trim(), notes });
    } catch (error) {
        console.error('Generate Notes From Text Error:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChatHistory,
    sendChatMessage,
    getNotes,
    addNote,
    getPrescription,
    savePrescription,
    getConsultationSummary,
    getPatientContext,
    uploadAudioAndGenerateNotes,
    finalizeNotes,
    getPatientSummary,
    generateNotesFromText
};
