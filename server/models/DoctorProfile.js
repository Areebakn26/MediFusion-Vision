const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // user_id handled by association
    specialization: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for registration, completed in profile
    },
    experience_years: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow null for registration, completed in profile
    },
    medical_college: {
        type: DataTypes.STRING,
    },
    passing_year: {
        type: DataTypes.INTEGER,
    },
    pmdc_number: { // Renamed from license_number
        type: DataTypes.STRING,
        unique: true,
        allowNull: true, // Allow null for existing records during migration
    },
    qualifications: {
        type: DataTypes.JSONB, // Array of { degree, institute, year }
        defaultValue: [],
    },
    bio: {
        type: DataTypes.TEXT,
    },
    consultation_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Allow null for registration, completed in profile
    },
    working_hours: {
        type: DataTypes.JSONB, // Detailed schedule { "Monday": { start: "09:00", end: "17:00" } }
    },
    timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Asia/Karachi',
    },
    unavailable_dates: {
        type: DataTypes.ARRAY(DataTypes.DATEONLY), // Days off
        defaultValue: [],
    },
    availability_schedule: { // Keeping for backward compatibility or simpler view
        type: DataTypes.JSONB,
    },
    profile_image: {
        type: DataTypes.STRING,
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    verification_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    verified_at: {
        type: DataTypes.DATE,
    },
    verified_by: {
        type: DataTypes.UUID, // Admin ID
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    review_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
});

module.exports = Doctor;
