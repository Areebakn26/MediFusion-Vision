/**
 * SAFE MIGRATION SCRIPT FOR MODULE 10 & 12
 * ========================================
 * Adds 'preferred_language' to Users table (if it doesn't exist).
 * Adds 'accessibility_settings' to PatientProfiles table.
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

const migrations = [
    // ── Users table ──────────────────────────────────────────────────────────
    `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en'`,
    `ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{}'::jsonb`,

    // ── Patients table ────────────────────────────────────────────────
    `ALTER TABLE "Patients" ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{}'::jsonb`,
];

async function runMigrations() {
    try {
        await seq.authenticate();
        console.log('✅ Connected to database.\n');

        let passed = 0;
        let failed = 0;

        for (const sql of migrations) {
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
        console.log(`========================================\n`);
    } catch (err) {
        console.error('❌ Could not connect to database:', err.message);
        process.exit(1);
    } finally {
        await seq.close();
    }
}

runMigrations();
