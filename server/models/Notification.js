const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // user_id handled by associations
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'info', // 'report_ready', 'scan_uploaded', 'appointment_reminder', etc.
    },
    link: {
        type: DataTypes.STRING, // Optional URL to navigate to when clicked
        allowNull: true,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: 'Notifications',
    timestamps: true,
});

module.exports = Notification;
