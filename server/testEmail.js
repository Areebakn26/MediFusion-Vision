require('dotenv').config();
const { sendVerificationEmail } = require('./utils/emailService');

(async () => {
    const testEmail = process.env.EMAIL_USER; // Send TO yourself to verify it arrives
    console.log(`[TEST] Sending real test email to: ${testEmail}`);
    try {
        const result = await sendVerificationEmail(testEmail, 'Test User', 'http://localhost:5173/login');
        if (result.success) {
            console.log('✅ SUCCESS! Email sent. Check your inbox at:', testEmail);
        } else {
            console.error('❌ FAILED. Error:', result.error);
        }
    } catch (e) {
        console.error('❌ Exception:', e.message);
    }
    process.exit(0);
})();
