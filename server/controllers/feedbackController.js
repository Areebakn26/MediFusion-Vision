const { Op } = require('sequelize');
const axios  = require('axios');
const { sequelize, Feedback, ModelVersion, RetrainingJob, Scan, Doctor, User, Patient } = require('../models');
const { calculateQualityScore } = require('../services/qualityChecker');
const { checkConsensus }        = require('../services/consensusEngine');

// Deduplicate feedback by scan_id using majority vote on corrected_diagnosis
const deduplicateByScan = (feedbackRows) => {
    const scanMap = new Map();
    for (const row of feedbackRows) {
        const key = row.scan_id ?? `no-scan-${row.feedback_id}`;
        if (!scanMap.has(key)) scanMap.set(key, []);
        scanMap.get(key).push(row);
    }
    const deduped = [];
    for (const rows of scanMap.values()) {
        if (rows.length === 1) { deduped.push(rows[0]); continue; }
        const tally = {};
        for (const r of rows) tally[r.corrected_diagnosis] = (tally[r.corrected_diagnosis] || 0) + 1;
        const majority = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        const base = [...rows].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))[0];
        deduped.push({ ...base, corrected_diagnosis: majority });
    }
    return deduped;
};

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

        const validatedFeedback = await Feedback.findAll({
            where: { validation_status: 'validated' },
            raw:   true,
        });

        const uniqueFeedback = deduplicateByScan(validatedFeedback);

        if (uniqueFeedback.length === 0) {
            return res.status(400).json({
                message: 'No validated feedback available for retraining. Submit and validate doctor corrections first.',
            });
        }

        const activeModel = await ModelVersion.findOne({
            where: { is_active: true },
            order: [['createdAt', 'DESC']],
        });

        const job = await RetrainingJob.create({
            triggered_by:        'manual',
            trigger_reason:      reason || 'Manual admin trigger',
            status:              'running',
            feedback_count_used: uniqueFeedback.length,
            old_model_version:   activeModel?.version_tag || null,
            started_at:          new Date(),
        });

        console.log(`[Retrain] Job ${job.job_id} started — ${uniqueFeedback.length} unique scans (${validatedFeedback.length} total records)`);

        // Respond immediately so the admin UI isn't blocked (Python can take minutes)
        res.status(201).json({
            job_id:  job.job_id,
            status:  'running',
            message: `Retraining job started. Using ${uniqueFeedback.length} unique scans.`,
        });

        // Run Python calls in background after response is sent
        (async () => {
            const brainPort   = process.env.BRAIN_MODEL_PORT   || 5003;
            const retinalPort = process.env.RETINAL_MODEL_PORT || 5002;

            const scans = await Scan.findAll({
                where: { id: uniqueFeedback.map((f) => f.scan_id).filter(Boolean) },
                attributes: ['id', 'scan_type'],
                raw: true,
            });
            const scanTypeMap = Object.fromEntries(scans.map((s) => [s.id, s.scan_type]));

            const brainFeedback = uniqueFeedback.filter((f) => {
                const t = scanTypeMap[f.scan_id];
                return t === 'mri_brain'
                    || f.model_version?.includes('brain')
                    || f.model_version?.includes('tumor')
                    || f.model_version?.includes('alzheimer');
            });
            const retinalFeedback = uniqueFeedback.filter((f) => {
                const t = scanTypeMap[f.scan_id];
                return t === 'retinal' || f.model_version?.includes('retinal');
            });

            let newVersion    = null;
            let anySuccess    = false;
            const failReasons = [];

            if (brainFeedback.length > 0) {
                try {
                    const response = await axios.post(
                        `http://localhost:${brainPort}/retrain`,
                        { feedback_data: brainFeedback, model_type: 'brain' },
                        { timeout: 300_000 }
                    );
                    console.log('[Retrain] Brain model response:', response.data);
                    newVersion = response.data?.new_version || newVersion;
                    anySuccess = true;
                } catch (err) {
                    console.error('[Retrain] Brain model retrain failed:', err.message);
                    failReasons.push(`Brain model: ${err.code === 'ECONNREFUSED' ? 'service not running on port ' + brainPort : err.message}`);
                }
            }

            if (retinalFeedback.length > 0) {
                try {
                    const response = await axios.post(
                        `http://localhost:${retinalPort}/retrain`,
                        { feedback_data: retinalFeedback, model_type: 'retinal' },
                        { timeout: 300_000 }
                    );
                    console.log('[Retrain] Retinal model response:', response.data);
                    newVersion = response.data?.new_version || newVersion;
                    anySuccess = true;
                } catch (err) {
                    console.error('[Retrain] Retinal model retrain failed:', err.message);
                    failReasons.push(`Retinal model: ${err.code === 'ECONNREFUSED' ? 'service not running on port ' + retinalPort : err.message}`);
                }
            }

            await job.update({
                status:            anySuccess ? 'completed' : 'failed',
                completed_at:      new Date(),
                new_model_version: newVersion,
                failure_reason:    anySuccess ? null : failReasons.join(' | ') || null,
            });

            if (anySuccess) {
                const usedScanIds = uniqueFeedback.map((f) => f.scan_id).filter(Boolean);
                if (usedScanIds.length > 0) {
                    await Feedback.update(
                        { validation_status: 'used_in_training' },
                        { where: { scan_id: usedScanIds, validation_status: 'validated' } }
                    );
                    console.log(`[Retrain] Marked ${usedScanIds.length} scans as used_in_training`);
                }
            }

            console.log(
                `[Retrain] Job ${job.job_id} ${anySuccess ? 'completed' : 'failed'}` +
                (newVersion ? ` — new version: ${newVersion}` : '')
            );
        })().catch((err) => {
            console.error('[Retrain] Background retraining error:', err.message);
            job.update({ status: 'failed' }).catch(() => {});
        });

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

// ══════════════════════════════════════════════════════════════
// @desc    Admin — list unique scans with flag counts & majority diagnosis
// @route   GET /api/feedback/scan-repository
// @access  Private (Admin)
// ══════════════════════════════════════════════════════════════
const getScanRepository = async (req, res) => {
    try {
        const allFeedback = await Feedback.findAll({
            include: [{
                model: Scan,
                attributes: ['id', 'scan_type'],
                include: [{
                    model: Patient,
                    attributes: ['id'],
                    include: [{ model: User, attributes: ['name'] }],
                }],
            }],
            order: [['createdAt', 'DESC']],
        });

        const scanMap = new Map();
        for (const fb of allFeedback) {
            const sid = fb.scan_id;
            if (!scanMap.has(sid)) {
                scanMap.set(sid, {
                    scan_id:          sid,
                    scan_type:        fb.Scan?.scan_type || 'unknown',
                    patient_name:     fb.Scan?.Patient?.User?.name || 'Unknown Patient',
                    flags:            [],
                    latest_flag_date: null,
                });
            }
            const entry = scanMap.get(sid);
            entry.flags.push({
                corrected_diagnosis: fb.corrected_diagnosis,
                validation_status:   fb.validation_status,
            });
            if (!entry.latest_flag_date || new Date(fb.createdAt) > new Date(entry.latest_flag_date))
                entry.latest_flag_date = fb.createdAt;
        }

        const result = [];
        for (const entry of scanMap.values()) {
            const tally = {};
            for (const f of entry.flags)
                tally[f.corrected_diagnosis] = (tally[f.corrected_diagnosis] || 0) + 1;
            const majority_diagnosis = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

            const statuses = entry.flags.map(f => f.validation_status);
            const status = statuses.every(s => s === 'validated') ? 'all validated'
                         : statuses.every(s => s === 'rejected')  ? 'all rejected'
                         : 'some pending';

            result.push({
                scan_id:          entry.scan_id,
                patient_name:     entry.patient_name,
                scan_type:        entry.scan_type,
                total_flags:      entry.flags.length,
                majority_diagnosis,
                latest_flag_date: entry.latest_flag_date,
                status,
            });
        }

        res.json({ total: result.length, data: result });
    } catch (error) {
        console.error('[Feedback] getScanRepository error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    submitFeedback,
    getFeedback,
    getFeedbackStats,
    triggerRetrain,
    getRetrainJobs,
    getScanRepository,
};
