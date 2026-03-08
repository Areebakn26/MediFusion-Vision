const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MedicalHistory = sequelize.define('MedicalHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // patient_id handled by association
    type: {
        type: DataTypes.ENUM('disease', 'surgery', 'chronic_condition'),
        allowNull: false,
    },
    condition: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    diagnosis_date: {
        type: DataTypes.DATEONLY,
    },
    status: {
        type: DataTypes.ENUM('active', 'cured', 'managed'),
        defaultValue: 'active',
    },
    notes: {
        type: DataTypes.TEXT,
    },
});

module.exports = MedicalHistory;
