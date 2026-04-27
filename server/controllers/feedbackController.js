const { Op } = require('sequelize');
const { sequelize, Feedback, ModelVersion, RetrainingJob, Scan, Doctor, User } = require('../models');
const { calculateQualityScore } = require('../services/qualityChecker');
const { checkConsensus }        = require('../services/consensusEngine');

// ─── Helper: bump 'v1.2' → 'v1.3', 'v1.9' → 'v2.0' ──────────────────────
const bumpVersion = (tag) => {
    const match = tag?.match(/^v(\d+)\.(\d+)$/);
    if (!match) return 'v1.0';
    const minor = parseInt(match[2]) + 1;
    const major = parseInt(match[1]) + (minor >= 10 ? 1 : 0);
    return `v${major}.${minor >= 10 ? 0 : minor}`;
};

// ─── Helper: evaluate all 4 retrain conditions ────────────────────────────
const shouldTriggerRetraining = async () => {
    const reasons = [];

    // Condition 1: validated feedback >= 100
    const validatedCount = await Feedback.count({ where: { validation_status: 'validated' } });
    if (validatedCount >= 100) {
        reasons.push(`${validatedCount} validated feedback items ready for training (threshold: 100)`);
    }

    // Condition 2: active model accuracy < 0.90
    const activeModel = await ModelVersion.findOne({
        where: { is_active: true },
        order: [['createdAt', 'DESC']],
    });
    if (activeModel?.accuracy != null && parseFloat(activeModel.accuracy) < 0.90) {
        reasons.push(`Active model accuracy (${(parseFloat(activeModel.accuracy) * 100).toFixed(1)}%) is below 90% threshold`);
    }

    // Condition 3: days since last completed retraining >= 30
    const lastJob = await RetrainingJob.findOne({
        where: { status: 'completed' },
        order: [['completed_at', 'DESC']],
    });
    if (lastJob?.completed_at) {
        const daysSince = Math.floor((Date.now() - new Date(lastJob.completed_at)) / 86400000);
        if (daysSince >= 30) {
            reasons.push(`${daysSince} days since last retraining (threshold: 30 days)`);
        }
    } else {
        reasons.push('No retraining has been performed yet');
    }

    // Condition 4: any single diagnosis class has >= 50 corrections
    const classCounts = await Feedback.findAll({
        attributes: [
            'corrected_diagnosis',
            [sequelize.fn('COUNT', sequelize.col('corrected_diagnosis')), 'count'],
        ],
        group: ['corrected_diagnosis'],
        raw: true,
    });
    classCounts.forEach(c => {
        if (parseInt(c.count) >= 50) {
            reasons.push(`Class "${c.corrected_diagnosis}" has ${c.count} corrections (threshold: 50)`);
        }
    });

    return { should_retrain: reasons.length > 0, retrain_reasons: reasons };
};

// ══════════════════════════════════════════════════════════════
// @desc    Doctor submits a correction / flags AI prediction
// @route   POST /api/feedback
// @access  Private (Doctor)
// ══════════════════════════════════════════════════════════════
const submitFeedback = async (req, res) => {
    try {
        const {
            scan_id,
            ai_prediction,
            ai_confidence,
            corrected_diagnosis,
            doctor_notes,
            feedback_reason,
            model_version,
        } = req.body;

        if (!scan_id || !ai_prediction || ai_confidence === undefined || !corrected_diagnosis || !model_version) {
            return res.status(400).json({
                message: 'Missing required fields: scan_id, ai_prediction, ai_confidence, corrected_diagnosis, model_version',
            });
        }

        const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const scan = await Scan.findByPk(scan_id);
        if (!scan) return res.status(404).json({ message: 'Scan not found' });

        const feedback = await Feedback.create({
            scan_id,
            doctor_id:            doctor.id,
            model_version,
            ai_prediction,
            ai_confidence:        parseFloat(ai_confidence),
            corrected_diagnosis,
            doctor_notes:         doctor_notes || null,
            feedback_reason:      feedback_reason || null,
            validation_status:    'pending',
        });

        // ── Quality Check ────────────────────────────────────────────────────
        const { quality_score, validation_status } = calculateQualityScore(
            feedback, doctor, scan.scan_type
        );
        await feedback.update({ quality_score, validation_status });

        // ── Consensus Engine ─────────────────────────────────────────────────
        const consensus = await checkConsensus(scan_id);

        console.log(
            `[Feedback] Submitted — id: ${feedback.feedback_id}, scan: ${scan_id},` +
            ` doctor: ${doctor.id}, quality: ${quality_score}, status: ${validation_status}`
        );

        res.status(201).json({
            success:           true,
            feedback_id:       feedback.feedback_id,
            quality_score,
            validation_status,
            consensus,
            message:           'Feedback submitted successfully',
        });
    } catch (error) {
        console.error('[Feedback] submitFeedback error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════
// @desc    Admin — list all feedback with optional filters
// @route   GET /api/feedback?status=&model_type=&limit=&offset=
// @access  Private (Admin)
// ══════════════════════════════════════════════════════════════
const getFeedback = async (req, res) => {
    try {
        const { status, model_type, limit = 20, offset = 0 } = req.query;

        // Build WHERE on Feedback
        const where = {};
        if (status) where.validation_status = status;

        // Build WHERE on Scan (model_type maps to scan_type)
        const scanWhere = {};
        if (model_type === 'retinal')                   scanWhere.scan_type = 'retinal';
        else if (model_type === 'tumor' || model_type === 'alzheimer') scanWhere.scan_type = 'mri_brain';

        const scanInclude = {
            model: Scan,
            attributes: ['id', 'scan_type', 'status'],
            ...(Object.keys(scanWhere).length > 0 && { where: scanWhere, required: true }),
        };

        const { count, rows } = await Feedback.findAndCountAll({
            where,
            include: [
                {
                    model: Doctor,
                    attributes: ['id'],
                    include: [{ model: User, attributes: ['name', 'email'] }],
                },
                scanInclude,
            ],
            order: [['createdAt', 'DESC']],
            limit:  parseInt(limit),
            offset: parseInt(offset),
        });

        res.json({
            total:  count,
            limit:  parseInt(limit),
            offset: parseInt(offset),
            data:   rows,
        });
    } catch (error) {
        console.error('[Feedback] getFeedback error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════
// @desc    Admin — feedback stats + retrain trigger check
// @route   GET /api/feedback/stats
// @access  Private (Admin)
// ══════════════════════════════════════════════════════════════
const getFeedbackStats = async (req, res) => {
    try {
        const [total, pending, validated, used_in_training] = await Promise.all([
            Feedback.count(),
            Feedback.count({ where: { validation_status: 'pending' } }),
            Feedback.count({ where: { validation_status: 'validated' } }),
            Feedback.count({ where: { validation_status: 'used_in_training' } }),
        ]);

        const activeModel = await ModelVersion.findOne({
            where: { is_active: true },
            order: [['createdAt', 'DESC']],
        });
        const accuracy_estimate = activeModel?.accuracy != null
            ? parseFloat(activeModel.accuracy)
            : null;

        const lastJob = await RetrainingJob.findOne({
            where: { status: 'completed' },
            order: [['completed_at', 'DESC']],
        });
        const days_since_last_retrain = lastJob?.completed_at
            ? Math.floor((Date.now() - new Date(lastJob.completed_at)) / 86400000)
            : null;

        const { should_retrain, retrain_reasons } = await shouldTriggerRetraining();

        res.json({
            total_feedback:        total,
            pending,
            validated,
            used_in_training,
            accuracy_estimate,
            days_since_last_retrain,
            should_retrain,
            retrain_reasons,
        });
    } catch (error) {
        console.error('[Feedback] getFeedbackStats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════
// @desc    Admin — manually trigger a retraining job
// @route   POST /api/feedback/trigger-retrain
// @access  Private (Admin)
// ══════════════════════════════════════════════════════════════
const triggerRetrain = async (req, res) => {
    try {
        const { reason } = req.body;

        const [activeModel, validatedCount] = await Promise.all([
            ModelVersion.findOne({ where: { is_active: true }, order: [['createdAt', 'DESC']] }),
            Feedback.count({ where: { validation_status: 'validated' } }),
        ]);

        const job = await RetrainingJob.create({
            triggered_by:        'manual',
            trigger_reason:      reason || 'Manual admin trigger',
            status:              'running',
            feedback_count_used: validatedCount,
            old_model_version:   activeModel?.version_tag || null,
            started_at:          new Date(),
        });

        console.log(`[Retrain] Job ${job.job_id} started — using ${validatedCount} validated items`);

        // Respond immediately so the admin sees the job started
        res.status(201).json({
            job_id:  job.job_id,
            status:  'running',
            message: `Retraining job started. Using ${validatedCount} validated feedback items.`,
        });

        // Simulate 3-second retraining
        setTimeout(async () => {
            try {
                const newVersion = bumpVersion(activeModel?.version_tag);
                await job.update({
                    status:            'completed',
                    completed_at:      new Date(),
                    new_model_version: newVersion,
                });
                console.log(`[Retrain] Job ${job.job_id} completed — new version: ${newVersion}`);
            } catch (e) {
                console.error('[Retrain] Failed to complete job:', e.message);
                await job.update({ status: 'failed' }).catch(() => {});
            }
        }, 3000);

    } catch (error) {
        console.error('[Feedback] triggerRetrain error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════
// @desc    Admin — list all retraining job history
// @route   GET /api/feedback/retrain-jobs
// @access  Private (Admin)
// ══════════════════════════════════════════════════════════════
const getRetrainJobs = async (req, res) => {
    try {
        const jobs = await RetrainingJob.findAll({
            order: [['createdAt', 'DESC']],
        });
        res.json(jobs);
    } catch (error) {
        console.error('[Feedback] getRetrainJobs error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    submitFeedback,
    getFeedback,
    getFeedbackStats,
    triggerRetrain,
    getRetrainJobs,
};
