const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById, getMyPatients, getPatientHistory, getDoctorAnalytics } = require('../controllers/doctorController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', getDoctors);
router.get('/my-patients', protect, requireRole(['doctor']), getMyPatients);
router.get('/analytics', protect, requireRole(['doctor']), getDoctorAnalytics);
router.get('/patients/:patientId/history', protect, requireRole(['doctor']), getPatientHistory);
router.get('/:id', getDoctorById);

module.exports = router;
