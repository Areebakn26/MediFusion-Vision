const { User } = require('./models');
const dotenv = require('dotenv');
dotenv.config();

async function checkUsers() {
    try {
        const users = await User.findAll({
            attributes: ['id', 'email', 'password', 'role', 'status']
        });
        console.log('--- Users in Database ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, PwdLen: ${u.password?.length}`);
        });

        // Test a specific user password match if we had one, but we don't.
        // Instead, let's just log the count and sample.
        console.log(`Total users: ${users.length}`);
    } catch (err) {
        console.error('Error checking users:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
