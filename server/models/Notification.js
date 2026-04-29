const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // user_id handled by association
    type: {
        type: DataTypes.ENUM(
            'appointment_booked',
            'appointment_cancelled',
            'appointment_rescheduled',
            'appointment_confirmed',
            'appointment_reminder',
            'report_ready',
            'info'
        ),
        defaultValue: 'info',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    data: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
}, {
    tableName: 'Notifications',
    timestamps: true,
});

module.exports = Notification;