const express = require('express');
const router = express.Router();
const { 
    uploadScan, 
    getScans, 
    getScanById, 
    createReport,
    runAIAnalysis,
    uploadExternalScan,
    uploadInternalScan,
    getAIAnalysis
} = require('../controllers/scanController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Patient scan upload
router.post('/upload', protect, uploadScan);

// External scan upload (Patient)
router.post('/external', protect, requireRole(['patient']), uploadExternalScan);

// Internal scan upload (Admin)
router.post('/internal', protect, requireRole(['admin']), uploadInternalScan);

// Get all scans (role-based filtering in controller)
router.get('/', protect, getScans);

// Get single scan
router.get('/:id', protect, getScanById);

// Get AI analysis results
router.get('/:id/analysis', protect, getAIAnalysis);

// Run AI analysis (Doctor only)
router.post('/:id/analyze', protect, requireRole(['doctor', 'admin']), runAIAnalysis);

// Create/Update report (Doctor only)
router.post('/:id/report', protect, requireRole(['doctor']), createReport);

module.exports = router;
