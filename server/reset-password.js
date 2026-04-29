const { User } = require('./models');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
    console.error('Usage: node reset-password.js <email> <newPassword>');
    process.exit(1);
}

(async () => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.error(`No user found with email: ${email}`);
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.login_attempts = 0;
        user.locked_until = null;
        await user.save({ hooks: false }); // skip beforeUpdate hook to avoid double-hashing

        console.log(`✅ Password reset for: ${email}`);
        console.log(`   New password: ${newPassword}`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
