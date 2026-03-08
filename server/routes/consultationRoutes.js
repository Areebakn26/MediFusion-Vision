const express = require('express');
const router = express.Router();
const {
    getChatHistory,
    getNotes,
    addNote,
    getPrescription,
    savePrescription,
    getConsultationSummary
} = require('../controllers/consultationController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Chat history
router.get('/:appointmentId/chat', protect, getChatHistory);

// Notes
router.get('/:appointmentId/notes', protect, getNotes);
router.post('/:appointmentId/notes', protect, requireRole(['doctor']), addNote);

// Prescription
router.get('/:appointmentId/prescription', protect, getPrescription);
router.post('/:appointmentId/prescription', protect, requireRole(['doctor']), savePrescription);

// Full consultation summary
router.get('/:appointmentId/summary', protect, getConsultationSummary);

module.exports = router;
