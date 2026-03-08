const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    verifyEmail,
    refreshToken,
    forgotPassword,
    resetPassword,
    updateProfile,
    updateLanguage
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/language', protect, updateLanguage);

// New Security Routes
router.post('/verify-email', verifyEmail);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
