const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RetrainingJob = sequelize.define('RetrainingJob', {
    job_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    triggered_by: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    trigger_reason: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
    },
    feedback_count_used: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    old_model_version: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    new_model_version: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    failure_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    tableName: 'retraining_jobs',
    timestamps: true,
});

module.exports = RetrainingJob;
