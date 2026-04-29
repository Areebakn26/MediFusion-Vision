const { User } = require('./models');

const email = process.argv[2];

if (!email) {
    console.error('Usage: node unlock-account.js <email>');
    process.exit(1);
}

(async () => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.error(`No user found with email: ${email}`);
            process.exit(1);
        }

        user.login_attempts = 0;
        user.locked_until = null;
        await user.save();

        console.log(`✅ Account unlocked for: ${email}`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();