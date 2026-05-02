const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // patient_id, doctor_id handled by association
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    time_slot: {
        type: DataTypes.STRING, // Keeping for display/legacy
        allowNull: false,
    },
    start_time: {
        type: DataTypes.DATE, // Full timestamp
        allowNull: true, // Allow null for now to support legacy
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    timezone: {
        type: DataTypes.STRING,
        defaultValue: 'Asia/Karachi',
    },
    type: {
        type: DataTypes.ENUM('physical', 'virtual'),
        defaultValue: 'physical',
    },
    meeting_link: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'pending',
    },
    reason: {
        type: DataTypes.TEXT,
    },
    original_start_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cancelled_by: {
        type: DataTypes.ENUM('patient', 'doctor', 'admin'),
        allowNull: true,
    },
    cancellation_reason: {
        type: DataTypes.TEXT,
    },
    reschedule_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    no_show: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    no_show_marked_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // AI Fields
    symptoms: {
        type: DataTypes.TEXT,
    },
    diagnosis: {
        type: DataTypes.TEXT,
    },
    consultation_summary: {
        type: DataTypes.TEXT, // AI Generated
    },
    transcript: {
        type: DataTypes.TEXT, // Full conversation
    },
    doctor_notes: {
        type: DataTypes.TEXT, // Manual edits
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['doctor_id', 'date', 'time_slot'],
            name: 'unique_doctor_appointment_slot',
            where: { status: { [Op.ne]: 'cancelled' } }
        },
        {
            unique: true,
            fields: ['patient_id', 'date', 'time_slot'],
            name: 'unique_patient_appointment_slot',
            where: { status: { [Op.ne]: 'cancelled' } }
        }
    ]
});

module.exports = Appointment;
