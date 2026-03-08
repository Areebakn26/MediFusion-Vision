const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const seq = new Sequelize(
    process.env.DB_NAME || 'medifusionvision',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
    }
);

async function main() {
    try {
        // List all users (patients, doctors, admins)
        const users = await seq.query(
            `SELECT id, name, email, role, status, email_verified, "createdAt" 
             FROM "Users" 
             ORDER BY role, "createdAt" DESC`,
            { type: seq.QueryTypes.SELECT }
        );

        console.log('\n========== ALL REGISTERED USERS ==========\n');
        console.log(`Total users: ${users.length}\n`);

        const grouped = { patient: [], doctor: [], admin: [] };
        users.forEach(u => { if (grouped[u.role]) grouped[u.role].push(u); });

        for (const [role, list] of Object.entries(grouped)) {
            if (list.length === 0) continue;
            console.log(`--- ${role.toUpperCase()}S (${list.length}) ---`);
            list.forEach(u => {
                console.log(`  ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Status: ${u.status} | Email Verified: ${u.email_verified}`);
            });
            console.log('');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await seq.close();
    }
}

main();
