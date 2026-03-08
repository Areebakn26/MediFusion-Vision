const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const seq = new Sequelize(
    process.env.DB_NAME || 'medifusionvision',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    { host: process.env.DB_HOST || 'localhost', dialect: 'postgres', logging: false }
);

async function createAdmin() {
    try {
        await seq.authenticate();
        console.log('✅ Connected to database.');

        // The Requested Admin Credentials
        const adminEmail = 'medifusionvision@gmail.com';
        const adminPassword = '12345678';

        // Check if admin already exists
        const [existingAdmins] = await seq.query(
            `SELECT * FROM "Users" WHERE email = ?`,
            { replacements: [adminEmail], type: seq.QueryTypes.SELECT }
        );

        if (existingAdmins) {
            console.log(`\n⚠️  Admin account already exists for ${adminEmail}!`);
            console.log(`Use these credentials to log in:`);
            console.log(`Email: ${adminEmail}`);
        } else {
            // Hash the password properly using bcrypt (10 rounds)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            // Insert the admin user 
            // Note: email_verified must be true, status must be active for admin access
            await seq.query(
                `INSERT INTO "Users" (id, name, email, password, role, is_active, status, email_verified, "createdAt", "updatedAt") 
                 VALUES (gen_random_uuid(), 'System Admin', ?, ?, 'admin', true, 'active', true, NOW(), NOW())`,
                { replacements: [adminEmail, hashedPassword], type: seq.QueryTypes.INSERT }
            );

            console.log(`\n🎉 Admin account successfully created!`);
            console.log(`==========================================`);
            console.log(`Email:    ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
            console.log(`==========================================`);
            console.log(`You can now log in at http://localhost:5173/login`);
        }
    } catch (err) {
        console.error('❌ Error creating Admin:', err.message);
    } finally {
        await seq.close();
    }
}

createAdmin();
