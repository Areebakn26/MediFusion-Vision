const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Scan = sequelize.define('Scan', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // patient_id, doctor_id handled by association
    scan_source: {
        type: DataTypes.ENUM('internal', 'external'), // Internal = Hospital/Admin, External = Patient
        allowNull: false,
    },
    scan_type: {
        type: DataTypes.ENUM('mri_brain', 'retinal', 'xray', 'ct_scan', 'ultrasound', 'other'),
        allowNull: false,
    },
    file_url: {  // FIXED: Changed from image_url to file_url
        type: DataTypes.STRING,
        allowNull: false,
    },
    uploaded_by: {
        type: DataTypes.ENUM('patient', 'admin'),
        allowNull: false,
    },
    // New fields for comprehensive scan management
    body_part: {
        type: DataTypes.STRING(100),
    },
    taken_date: {
        type: DataTypes.DATEONLY,
    },
    facility_name: {
        type: DataTypes.STRING(255),
    },
    lab_technician: {
        type: DataTypes.STRING(255),
    },
    file_format: {
        type: DataTypes.STRING(20), // jpeg, png, dicom, tiff
    },
    file_size: {
        type: DataTypes.BIGINT, // in bytes
    },
    image_dimensions: {
        type: DataTypes.JSONB, // {width: 1024, height: 768}
    },
    quality_score: {
        type: DataTypes.DECIMAL(3, 2), // 0.00 to 1.00
    },
    validation_status: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending',
    },
    validation_notes: {
        type: DataTypes.TEXT,
    },
    is_authentic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    metadata: {
        type: DataTypes.JSONB, // EXIF data, DICOM tags, etc.
        defaultValue: {},
    },
    notes: {
        type: DataTypes.TEXT,
    },
    // AI-related fields
    ai_prediction: {
        type: DataTypes.JSONB, // Model output, confidence scores
    },
    ai_heatmap_url: {
        type: DataTypes.TEXT,
    },
    ai_explanation: {
        type: DataTypes.JSONB,
    },
    processed_at: {
        type: DataTypes.DATE,
    },
    // Doctor review fields
    doctor_comments: {
        type: DataTypes.TEXT,
    },
    report_medical: {
        type: DataTypes.TEXT,
    },
    report_patient_friendly: {
        type: DataTypes.TEXT,
    },
    status: {
        type: DataTypes.ENUM('pending', 'analyzed', 'verified', 'flagged'),
        defaultValue: 'pending',
    },
});

module.exports = Scan;
