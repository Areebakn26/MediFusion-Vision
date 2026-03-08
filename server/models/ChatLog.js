const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatLog = sequelize.define('ChatLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // appointment_id handled by association
    sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = ChatLog;
