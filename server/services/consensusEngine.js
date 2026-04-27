'use strict';

const { Feedback } = require('../models');

/**
 * Consensus Engine Service
 *
 * Rules:
 *   1. 2+ doctors agree on same corrected_diagnosis
 *      AND combined quality_score >= 1.5  → validate ALL matching entries
 *   2. Single doctor feedback with quality_score >= 0.85  → auto-validate
 *
 * @param {string} scanId - UUID of the scan
 * @returns {Promise<{ consensusReached: boolean, diagnosis: string|null, count: number }>}
 */
const checkConsensus = async (scanId) => {
    // Fetch all non-rejected feedback for this scan
    const allFeedback = await Feedback.findAll({
        where: {
            scan_id: scanId,
            validation_status: ['pending', 'validated'],
        },
        order: [['createdAt', 'ASC']],
    });

    if (!allFeedback.length) {
        return { consensusReached: false, diagnosis: null, count: 0 };
    }

    // ── Rule 2: single doctor with quality_score >= 0.85 ─────────────────────
    if (allFeedback.length === 1) {
        const single = allFeedback[0];
        const score = parseFloat(single.quality_score ?? 0);

        if (score >= 0.85 && single.validation_status !== 'validated') {
            await single.update({ validation_status: 'validated' });
            console.log(
                `[ConsensusEngine] Auto-validated feedback ${single.feedback_id}` +
                ` (single doctor, quality=${score})`
            );
            return {
                consensusReached: true,
                diagnosis: single.corrected_diagnosis,
                count: 1,
            };
        }

        return { consensusReached: false, diagnosis: null, count: 1 };
    }

    // ── Rule 1: group by corrected_diagnosis ──────────────────────────────────
    const groups = {};
    for (const fb of allFeedback) {
        const key = (fb.corrected_diagnosis || '').toLowerCase().trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(fb);
    }

    for (const [diagKey, entries] of Object.entries(groups)) {
        if (entries.length < 2) continue;

        const combinedScore = entries.reduce(
            (sum, fb) => sum + parseFloat(fb.quality_score ?? 0),
            0
        );

        if (combinedScore >= 1.5) {
            // Validate all entries in this consensus group
            const ids = entries.map((fb) => fb.feedback_id);
            await Feedback.update(
                {
                    validation_status: 'validated',
                    consensus_count:   entries.length,
                },
                { where: { feedback_id: ids } }
            );

            const diagnosisLabel = entries[0].corrected_diagnosis;
            console.log(
                `[ConsensusEngine] Consensus reached for scan ${scanId}` +
                ` — diagnosis="${diagnosisLabel}", count=${entries.length}` +
                `, combinedScore=${combinedScore.toFixed(2)}`
            );

            return {
                consensusReached: true,
                diagnosis:        diagnosisLabel,
                count:            entries.length,
            };
        }
    }

    return { consensusReached: false, diagnosis: null, count: allFeedback.length };
};

module.exports = { checkConsensus };
