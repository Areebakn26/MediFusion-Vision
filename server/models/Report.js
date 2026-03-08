const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // scan_id, doctor_id, patient_id handled by associations
    diagnosis: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ai_findings: {
        type: DataTypes.JSONB, // AI model output
        defaultValue: {},
    },
    doctor_notes: {
        type: DataTypes.TEXT,
    },
    final_report: {
        type: DataTypes.TEXT, // Combined AI + Doctor report
    },
    report_medical: {
        type: DataTypes.TEXT, // Technical medical report
    },
    report_patient_friendly: {
        type: DataTypes.TEXT, // Simplified for patients
    },
    finalized: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    finalized_at: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'Reports',
    timestamps: true,
});

module.exports = Report;
