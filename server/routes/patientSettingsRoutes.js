const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/patientSettingsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

module.exports = router;
