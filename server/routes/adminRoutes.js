const express = require('express');
const router = express.Router();
const {
    getAllUsers, blockUser, deleteUser,
    getAllDoctors, verifyDoctor,
    getAdminStats, getAdminAnalytics, getAIStats
} = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/users', protect, requireRole(['admin']), getAllUsers);
router.put('/users/:id/block', protect, requireRole(['admin']), blockUser);
router.delete('/users/:id', protect, requireRole(['admin']), deleteUser);

router.get('/doctors', protect, requireRole(['admin']), getAllDoctors);
router.put('/doctor/:id/verify', protect, requireRole(['admin']), verifyDoctor);

router.get('/stats', protect, requireRole(['admin']), getAdminStats);
router.get('/analytics', protect, requireRole(['admin']), getAdminAnalytics);
router.get('/ai-stats', protect, requireRole(['admin']), getAIStats);

module.exports = router;
