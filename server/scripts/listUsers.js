const { User } = require('../models');

async function listRecentUsers() {
    try {
        const users = await User.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt']
        });
        console.log('Recent Users:');
        console.table(users.map(u => u.get({ plain: true })));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

listRecentUsers();
