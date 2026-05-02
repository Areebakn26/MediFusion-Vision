const { Notification } = require('../models');

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.is_read = true;
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { is_read: true },
            { where: { user_id: req.user.id, is_read: false } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
