const express = require('express');
const router = express.Router();
const {
    submitFeedback,
    getFeedback,
    getFeedbackStats,
    triggerRetrain,
    getRetrainJobs,
    getScanRepository,
} = require('../controllers/feedbackController');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { registerNewVersion, deployModel, rollbackModel } = require('../services/modelDeployer');
const { ModelVersion } = require('../models');

// Doctor: submit a correction / flag an AI prediction
router.post('/', protect, requireRole(['doctor']), submitFeedback);

// Admin: stats + retrain decision (must be before '/' GET to avoid shadowing)
router.get('/stats', protect, requireRole(['admin']), getFeedbackStats);

// Admin: manually trigger retraining
router.post('/trigger-retrain', protect, requireRole(['admin']), triggerRetrain);

// Admin: list all retraining job history
router.get('/retrain-jobs', protect, requireRole(['admin']), getRetrainJobs);

// Admin: grouped scan view with flag counts and majority diagnosis
router.get('/scan-repository', protect, requireRole(['admin']), getScanRepository);

// Admin: list all feedback with filters (?status=&model_type=&limit=&offset=)
router.get('/', protect, requireRole(['admin']), getFeedback);

// ── Model Registry ────────────────────────────────────────────────────────────

// GET /api/feedback/models/versions — list all registered model versions
router.get('/models/versions', protect, requireRole(['admin']), async (req, res) => {
    try {
        const versions = await ModelVersion.findAll({ order: [['createdAt', 'DESC']] });
        res.json(versions);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/feedback/models/deploy — activate a specific version
router.post('/models/deploy', protect, requireRole(['admin']), async (req, res) => {
    try {
        const { model_type, version_tag } = req.body;
        if (!model_type || !version_tag) {
            return res.status(400).json({ message: 'model_type and version_tag are required' });
        }
        const result = await deployModel(model_type, version_tag);
        res.json({ success: true, message: `Deployed ${model_type} version "${version_tag}"`, version: result.version });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/feedback/models/rollback — roll back to a previous version
router.post('/models/rollback', protect, requireRole(['admin']), async (req, res) => {
    try {
        const { model_type, target_version } = req.body;
        if (!model_type || !target_version) {
            return res.status(400).json({ message: 'model_type and target_version are required' });
        }
        const result = await rollbackModel(model_type, target_version);
        res.json({ success: true, message: `Rolled back ${model_type} to "${target_version}"`, version: result.version });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

