const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prescription = sequelize.define('Prescription', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // appointment_id handled by association
    medications: {
        type: DataTypes.JSONB, // Array of { name, dosage, frequency, duration, instructions }
        allowNull: false,
        defaultValue: [],
    },
});

module.exports = Prescription;
