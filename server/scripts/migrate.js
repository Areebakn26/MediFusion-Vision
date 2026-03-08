/**
 * SAFE MIGRATION SCRIPT
 * =====================
 * Run this ONE TIME whenever you add new columns to a model.
 * It uses "ADD COLUMN IF NOT EXISTS" — meaning:
 *   - If the column already exists → it is SKIPPED (no error, no data loss)
 *   - If the column doesn't exist yet → it is ADDED safely
 *
 * USAGE:
 *   node scripts/migrate.js
 *
 * This NEVER drops tables, NEVER wipes data, NEVER touches existing columns.
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const seq = new Sequelize(
    process.env.DB_NAME || 'medifusionvision',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    { host: process.env.DB_HOST || 'localhost', dialect: 'postgres', logging: false }
);

// Each item = one ALTER TABLE statement to run
// Pattern: ADD COLUMN IF NOT EXISTS <name> <type> <default>
// PostgreSQL supports IF NOT EXISTS for ADD COLUMN since v9.
const migrations = [
    // ── Appointment table ────────────────────────────────────────────────────
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS original_start_time TIMESTAMP WITH TIME ZONE`,
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(10) CHECK (cancelled_by IN ('patient','doctor','admin'))`,
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`,
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0`,
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS no_show BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS no_show_marked_at TIMESTAMP WITH TIME ZONE`,

    // ── DoctorProfile table ──────────────────────────────────────────────────
    `ALTER TABLE "Doctors" ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Karachi'`,

    // ── PaymentTransactions table ────────────────────────────────────────────
    // This table is NEW — create it if it doesn't exist
    `CREATE TABLE IF NOT EXISTS "PaymentTransactions" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES "Appointments"(id) ON DELETE SET NULL,
        stripe_payment_intent_id VARCHAR(255),
        amount_paid DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'usd',
        refund_status VARCHAR(20) DEFAULT 'none' CHECK (refund_status IN ('none','partial','full','failed')),
        refund_amount DECIMAL(10,2),
        refund_transaction_id VARCHAR(255),
        refund_initiated_at TIMESTAMP WITH TIME ZONE,
        refund_completed_at TIMESTAMP WITH TIME ZONE,
        payment_method_details JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
];

async function runMigrations() {
    try {
        await seq.authenticate();
        console.log('✅ Connected to database.\n');

        let passed = 0;
        let failed = 0;

        for (const sql of migrations) {
            // Extract a short label for logging
            const label = sql.trim().split('\n')[0].substring(0, 80);
            try {
                await seq.query(sql);
                console.log(`  ✔  ${label}`);
                passed++;
            } catch (err) {
                console.error(`  ✘  ${label}`);
                console.error(`     Error: ${err.message}\n`);
                failed++;
            }
        }

        console.log(`\n========================================`);
        console.log(`Migration complete: ${passed} passed, ${failed} failed`);
        if (failed === 0) {
            console.log(`All columns are in place. Your data was not touched.`);
        } else {
            console.log(`Some migrations failed. Review the errors above.`);
        }
        console.log(`========================================\n`);
    } catch (err) {
        console.error('❌ Could not connect to database:', err.message);
        process.exit(1);
    } finally {
        await seq.close();
    }
}

runMigrations();
