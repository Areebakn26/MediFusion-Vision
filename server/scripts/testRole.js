const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const seq = new Sequelize(
    process.env.DB_NAME || 'medifusionvision',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    { host: process.env.DB_HOST || 'localhost', dialect: 'postgres', logging: false }
);

async function check() {
    try {
        const [users] = await seq.query('SELECT name, email, role, status FROM "Users" WHERE name LIKE \'%Areeba%\' LIMIT 5');
        console.log('--- FOUND USERS ---');
        console.log(JSON.stringify(users, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await seq.close();
    }
}
check();
