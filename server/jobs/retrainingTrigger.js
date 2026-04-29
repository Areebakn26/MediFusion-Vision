'use strict';

/**
 * Retraining Trigger — Cron Job
 *
 * Runs daily at 02:00 AM.
 * Checks all 4 shouldTriggerRetraining() conditions and,
 * if any fire, creates a RetrainingJob record then calls the Python services.
 */

const cron     = require('node-cron');
const axios    = require('axios');
const { sequelize, Feedback, ModelVersion, RetrainingJob, Scan } = require('../models');

// ─── Mirror of the helper in feedbackController ───────────────────────────────
const shouldTriggerRetraining = async () => {
    const reasons = [];

    // Condition 1: validated feedback >= 100
    const validatedCount = await Feedback.count({ where: { validation_status: 'validated' } });
    if (validatedCount >= 100) {
        reasons.push(`${validatedCount} validated samples ready (threshold: 100)`);
    }

    // Condition 2: active model accuracy < 90 %
    const activeModel = await ModelVersion.findOne({
        where: { is_active: true },
        order: [['createdAt', 'DESC']],
    });
    if (activeModel?.accuracy != null && parseFloat(activeModel.accuracy) < 0.90) {
        reasons.push(
            `Active model accuracy ${(parseFloat(activeModel.accuracy) * 100).toFixed(1)}% < 90%`
        );
    }

    // Condition 3: >= 30 days since last completed retraining
    const lastJob = await RetrainingJob.findOne({
        where: { status: 'completed' },
        order: [['completed_at', 'DESC']],
    });
    if (lastJob?.completed_at) {
        const daysSince = Math.floor((Date.now() - new Date(lastJob.completed_at)) / 86_400_000);
        if (daysSince >= 30) {
            reasons.push(`${daysSince} days since last retrain (threshold: 30)`);
        }
    } else {
        reasons.push('No retraining has been performed yet');
    }

    // Condition 4: any single class has >= 50 corrections
    const classCounts = await Feedback.findAll({
        attributes: [
            'corrected_diagnosis',
            [sequelize.fn('COUNT', sequelize.col('corrected_diagnosis')), 'count'],
        ],
        group: ['corrected_diagnosis'],
        raw:   true,
    });
    classCounts.forEach((c) => {
        if (parseInt(c.count) >= 50) {
            reasons.push(`Class "${c.corrected_diagnosis}" has ${c.count} corrections (threshold: 50)`);
        }
    });

    return { should_retrain: reasons.length > 0, retrain_reasons: reasons };
};

// ─── Scan deduplication via majority vote ────────────────────────────────────
const deduplicateByScan = (feedbackRows) => {
    const scanMap = new Map();

    for (const row of feedbackRows) {
        const key = row.scan_id ?? `no-scan-${row.feedback_id}`;
        if (!scanMap.has(key)) scanMap.set(key, []);
        scanMap.get(key).push(row);
    }

    const deduped = [];
    for (const rows of scanMap.values()) {
        if (rows.length === 1) {
            deduped.push(rows[0]);
            continue;
        }
        // Tally votes per diagnosis
        const tally = {};
        for (const row of rows) {
            const d = row.corrected_diagnosis;
            tally[d] = (tally[d] || 0) + 1;
        }
        const majority = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        // Use highest-quality row as base, override diagnosis with majority label
        const base = [...rows].sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))[0];
        deduped.push({ ...base, corrected_diagnosis: majority });
    }

    return deduped;
};

// ─── Core job logic ───────────────────────────────────────────────────────────
const runRetrainingCheck = async () => {
    console.log('[RetrainingTrigger] Running daily check…');

    const { should_retrain, retrain_reasons } = await shouldTriggerRetraining();

    if (!should_retrain) {
        console.log('[RetrainingTrigger] No trigger conditions met — skipping.');
        return;
    }

    console.log('[RetrainingTrigger] Trigger conditions met:', retrain_reasons);

    // Fetch validated feedback to send as training data
    const validatedFeedback = await Feedback.findAll({
        where: { validation_status: 'validated' },
        raw:   true,
    });

    const totalFeedbackCount = validatedFeedback.length;
    const uniqueFeedback     = deduplicateByScan(validatedFeedback);
    console.log(
        `[RetrainingTrigger] Deduplication: ${totalFeedbackCount} feedback records → ` +
        `${uniqueFeedback.length} unique scans`
    );

    const activeModel = await ModelVersion.findOne({
        where: { is_active: true },
        order: [['createdAt', 'DESC']],
    });

    // Create retraining job record
    const job = await RetrainingJob.create({
        triggered_by:        'cron',
        trigger_reason:      retrain_reasons.join(' | '),
        status:              'running',
        feedback_count_used: uniqueFeedback.length,
        old_model_version:   activeModel?.version_tag || null,
        started_at:          new Date(),
    });

    console.log(`[RetrainingTrigger] Job ${job.job_id} created — calling Python services…`);

    // ── Call Brain Model ──────────────────────────────────────────────────────
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

    let newVersion = null;
    let anySuccess = false;

    // Brain retraining
    if (brainFeedback.length > 0) {
        try {
            const response = await axios.post(
                `http://localhost:${brainPort}/retrain`,
                { feedback_data: brainFeedback, model_type: 'brain' },
                { timeout: 300_000 } // 5 minutes max
            );
            console.log('[RetrainingTrigger] Brain model response:', response.data);
            newVersion = response.data?.new_version || newVersion;
            anySuccess = true;
        } catch (err) {
            console.error('[RetrainingTrigger] Brain model retrain failed:', err.message);
        }
    }

    // Retinal retraining
    if (retinalFeedback.length > 0) {
        try {
            const response = await axios.post(
                `http://localhost:${retinalPort}/retrain`,
                { feedback_data: retinalFeedback, model_type: 'retinal' },
                { timeout: 300_000 }
            );
            console.log('[RetrainingTrigger] Retinal model response:', response.data);
            newVersion = response.data?.new_version || newVersion;
            anySuccess = true;
        } catch (err) {
            console.error('[RetrainingTrigger] Retinal model retrain failed:', err.message);
        }
    }

    // Update job status
    await job.update({
        status:            anySuccess ? 'completed' : 'failed',
        completed_at:      new Date(),
        new_model_version: newVersion,
    });

    // Mark all feedback used in this run as consumed
    if (anySuccess) {
        const usedScanIds = uniqueFeedback.map((f) => f.scan_id).filter(Boolean);
        if (usedScanIds.length > 0) {
            await Feedback.update(
                { validation_status: 'used_in_training' },
                { where: { scan_id: usedScanIds, validation_status: 'validated' } }
            );
            console.log(`[RetrainingTrigger] Marked ${usedScanIds.length} scans as used_in_training`);
        }
    }

    console.log(
        `[RetrainingTrigger] Job ${job.job_id} ${anySuccess ? 'completed' : 'failed'}` +
        (newVersion ? ` — new version: ${newVersion}` : '')
    );
};

// ─── Scheduler ────────────────────────────────────────────────────────────────
const initRetrainingCron = () => {
    // Runs at 02:00 AM every day
    cron.schedule('0 2 * * *', async () => {
        try {
            await runRetrainingCheck();
        } catch (err) {
            console.error('[RetrainingTrigger] Unhandled error in cron job:', err);
        }
    });

    console.log('[RetrainingTrigger] Cron job scheduled — daily at 02:00 AM');
};

module.exports = { initRetrainingCron, runRetrainingCheck };
