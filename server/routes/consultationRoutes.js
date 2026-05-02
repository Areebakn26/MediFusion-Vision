const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/consultationController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Chat — accessible to all authenticated users in the appointment
router.get('/:appointmentId/chat', protect, getChatHistory);
router.post('/:appointmentId/chat', protect, sendChatMessage);

// Notes
router.get('/:appointmentId/notes', protect, requireRole(['doctor', 'admin']), getNotes);
router.post('/:appointmentId/notes', protect, requireRole(['doctor']), addNote);

// Prescription
router.get('/:appointmentId/prescription', protect, requireRole(['doctor', 'admin']), getPrescription);
router.post('/:appointmentId/prescription', protect, requireRole(['doctor']), savePrescription);

// Full consultation summary (Clinical)
router.get('/:appointmentId/summary', protect, requireRole(['doctor', 'admin']), getConsultationSummary);

// Patient context (history, scans, previous notes)
router.get('/:appointmentId/patient-context', protect, requireRole(['doctor']), getPatientContext);

// AI Note-Taker
router.post('/:appointmentId/upload-audio', protect, requireRole(['doctor']), uploadAudioAndGenerateNotes);
router.patch('/:appointmentId/finalize-notes', protect, requireRole(['doctor']), finalizeNotes);

// Restricted patient summary (Only the plain language part)
router.get('/:appointmentId/patient-summary', protect, getPatientSummary);

// Generate notes from typed transcript (no audio — for testing/manual entry)
router.post('/:appointmentId/generate-notes-from-text', protect, requireRole(['doctor']), generateNotesFromText);

module.exports = router;
