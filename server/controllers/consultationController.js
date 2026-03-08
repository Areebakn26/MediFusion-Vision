const { ChatLog, ConsultationNote, Prescription, User, Appointment } = require('../models');

// @desc    Get chat history for an appointment
// @route   GET /api/consultation/:appointmentId/chat
// @access  Private
const getChatHistory = async (req, res) => {
    try {
        const chatHistory = await ChatLog.findAll({
            where: { appointment_id: req.params.appointmentId },
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'role'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        // Format for frontend compatibility
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

module.exports = {
    getChatHistory,
    getNotes,
    addNote,
    getPrescription,
    savePrescription,
    getConsultationSummary
};
