const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // user_id is handled by association in index.js
    date_of_birth: {
        type: DataTypes.DATEONLY,
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
    },
    blood_group: {
        type: DataTypes.STRING,
    },
    height: {
        type: DataTypes.FLOAT, // in cm
    },
    weight: {
        type: DataTypes.FLOAT, // in kg
    },
    address: {
        type: DataTypes.TEXT,
    },
    emergency_contact_phone: {
        type: DataTypes.STRING,
    },
    allergies: {
        type: DataTypes.JSONB, // Array of strings or objects
        defaultValue: [],
    },
    accessibility_settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
    cnic: {
        type: DataTypes.STRING,
        unique: true,
        // validate: { is: /^[0-9]{5}-[0-9]{7}-[0-9]$/ } // Optional regex validation
    },
    emergency_contact: {
        type: DataTypes.JSONB, // { name, relation, phone }
    },
    medical_history: {
        type: DataTypes.JSONB, // Summary of conditions, surgeries
        defaultValue: [],
    },
    current_medications: {
        type: DataTypes.ARRAY(DataTypes.TEXT), // List of current meds
        defaultValue: [],
    },
});

module.exports = Patient;
