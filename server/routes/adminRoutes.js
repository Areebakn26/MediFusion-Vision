const express = require('express');
const router = express.Router();
const { getAllUsers, getAllDoctors, verifyDoctor, getAdminStats } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/users', protect, requireRole(['admin']), getAllUsers);
router.get('/doctors', protect, requireRole(['admin']), getAllDoctors);
router.put('/doctor/:id/verify', protect, requireRole(['admin']), verifyDoctor);
router.get('/stats', protect, requireRole(['admin']), getAdminStats);

module.exports = router;

