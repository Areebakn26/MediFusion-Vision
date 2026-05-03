'use strict';

/**
 * Quality Checker Service
 * Scores doctor feedback 0.0–1.0 and derives validation_status.
 *
 * Scoring breakdown:
 *   Specialization match  30 %
 *   Years of experience   20 %
 *   Notes quality         15 %
 *   Reason provided       10 %
 *   AI confidence gap     25 %
 */

// ─── Internal helper ──────────────────────────────────────────────────────────
const _specializationScore = (scanType, spec) => {
    const s = (spec || '').toLowerCase();

    if (scanType === 'mri_brain') {
        if (s.includes('neurolog') || s.includes('radiolog')) return 0.30;
    } else if (scanType === 'retinal') {
        if (s.includes('ophthalmol') || s.includes('radiolog')) return 0.30;
    }

    return 0.10; // any other combination
};

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * Calculate a quality score and derive validation_status for a feedback record.
 *
 * @param {object} feedback      - Feedback Sequelize instance (post-create)
 * @param {object} doctorProfile - Doctor Sequelize instance
 * @param {string} scanType      - 'mri_brain' | 'retinal'
 * @returns {{ quality_score: number, validation_status: string }}
 */
const calculateQualityScore = (feedback, doctorProfile, scanType = '') => {
    let score = 0;

    // ── 1. Specialization match (30%) ─────────────────────────────────────────
    score += _specializationScore(scanType, doctorProfile?.specialization);

    // ── 2. Years of experience (20%) ──────────────────────────────────────────
    // NOTE: actual DB field is `experience_years` (not years_experience)
    const years = doctorProfile?.experience_years;
    if (years != null && !isNaN(years)) {
        score += Math.min(years / 10, 1.0) * 0.20;
    } else {
        score += 0.10; // not available — use fallback
    }

    // ── 3. Notes quality (15%) ────────────────────────────────────────────────
    const notes = feedback?.doctor_notes || '';
    if      (notes.length > 50) score += 0.15;
    else if (notes.length > 0)  score += 0.07;
    // else 0 — no notes provided

    // ── 4. Reason provided (10%) ──────────────────────────────────────────────
    if (feedback?.feedback_reason?.trim?.()?.length > 0) score += 0.10;

    // ── 5. AI confidence gap (25%) ────────────────────────────────────────────
    const conf = parseFloat(feedback?.ai_confidence ?? 0);
    if      (conf > 0.85) score += 0.25; // high-confidence AI, doctor disagrees — valuable
    else if (conf < 0.60) score += 0.10; // AI already uncertain — lower value
    else                  score += 0.15; // mid-range confidence

    // Round to 2 decimal places and cap at 1.0
    const quality_score = Math.min(Math.round(score * 100) / 100, 1.0);

    // ── Derive validation_status ──────────────────────────────────────────────
    let validation_status;
    if      (quality_score >= 0.75) validation_status = 'validated';
    else if (quality_score <  0.40) validation_status = 'rejected';
    else                            validation_status = 'pending';

    console.log(
        `[QualityChecker] score=${quality_score} status=${validation_status}` +
        ` (spec=${doctorProfile?.specialization}, years=${years}, conf=${conf})`
    );

    return { quality_score, validation_status };
};

module.exports = { calculateQualityScore };
