const { Patient, User } = require('../models');

// @desc    Get patient accessibility settings
// @route   GET /api/patient/settings
// @access  Private
const getSettings = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user || user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. Only patients can access these settings.' });
        }

        const patient = await Patient.findOne({ where: { user_id: req.user.id } });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found.' });
        }

        res.json({
            accessibilitySettings: patient.accessibility_settings || {},
            preferredLanguage: user.preferred_language || 'en'
        });
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update patient accessibility settings
// @route   PUT /api/patient/settings
// @access  Private
const updateSettings = async (req, res) => {
    const { accessibilitySettings, preferredLanguage } = req.body;

    try {
        const user = await User.findByPk(req.user.id);
        if (!user || user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const patient = await Patient.findOne({ where: { user_id: req.user.id } });
        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found.' });
        }

        // Merge logic for accessibility_settings
        if (accessibilitySettings) {
            patient.accessibility_settings = {
                ...(patient.accessibility_settings || {}),
                ...accessibilitySettings
            };
            await patient.save();
        }

        // Update user language if provided
        if (preferredLanguage) {
            user.preferred_language = preferredLanguage;
            await user.save();
        }

        res.json({
            message: 'Settings updated successfully',
            accessibilitySettings: patient.accessibility_settings,
            preferredLanguage: user.preferred_language
        });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
