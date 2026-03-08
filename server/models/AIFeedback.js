const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AIFeedback = sequelize.define('AIFeedback', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // scan_id, doctor_id handled by association
    is_flagged: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    correction_details: {
        type: DataTypes.TEXT,
    },
    admin_review_status: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending',
    },
    flag_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
});

module.exports = AIFeedback;
