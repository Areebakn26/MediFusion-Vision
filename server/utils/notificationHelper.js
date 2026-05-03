const { Notification } = require('../models');

/**
 * Create a persisted notification for a user.
 * Silent — logs errors but never throws, so callers aren't disrupted.
 */
const createNotification = async (userId, type, title, message, data = {}) => {
    try {
        await Notification.create({ user_id: userId, type, title, message, data });
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
    }
};

module.exports = { createNotification };