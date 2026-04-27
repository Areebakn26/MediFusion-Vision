const express = require('express');
const router = express.Router();
const {
    submitFeedback,
    getFeedback,
    getFeedbackStats,
    triggerRetrain,
    getRetrainJobs,
} = require('../controllers/feedbackController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Doctor: submit a correction / flag an AI prediction
router.post('/', protect, requireRole(['doctor']), submitFeedback);

// Admin: stats + retrain decision (must be before '/' GET to avoid shadowing)
router.get('/stats', protect, requireRole(['admin']), getFeedbackStats);

// Admin: manually trigger retraining
router.post('/trigger-retrain', protect, requireRole(['admin']), triggerRetrain);

// Admin: list all retraining job history
router.get('/retrain-jobs', protect, requireRole(['admin']), getRetrainJobs);

// Admin: list all feedback with filters (?status=&model_type=&limit=&offset=)
router.get('/', protect, requireRole(['admin']), getFeedback);

module.exports = router;
