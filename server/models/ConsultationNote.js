const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsultationNote = sequelize.define('ConsultationNote', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // appointment_id handled by association
    author_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    note_type: {
        type: DataTypes.ENUM('clinical', 'observation', 'recommendation', 'follow_up'),
        defaultValue: 'clinical',
    },
    is_private: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // If true, only visible to doctor
    },
}, {
    tableName: 'ConsultationNotes',
    timestamps: true,
});

module.exports = ConsultationNote;
