const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
    feedback_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // scan_id, doctor_id handled by associations
    model_version: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    ai_prediction: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    ai_confidence: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false,
    },
    corrected_diagnosis: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    doctor_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    feedback_reason: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    quality_score: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
    },
    consensus_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    validation_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
    },
}, {
    tableName: 'ai_feedback',
    timestamps: true,
});

module.exports = Feedback;
