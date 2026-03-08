const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('patient', 'doctor', 'admin'),
        defaultValue: 'patient',
    },
    phone: {
        type: DataTypes.STRING,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    preferred_language: {
        type: DataTypes.STRING,
        defaultValue: 'en',
    },
    accessibility_settings: {
        type: DataTypes.JSONB, // Stores { highContrast: bool, textSize: 'large' }
        defaultValue: {},
    },
    // Security & Status Fields
    login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    locked_until: {
        type: DataTypes.DATE,
    },
    last_login: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'banned', 'pending_verification'),
        defaultValue: 'pending_verification',
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    email_verification_token: {
        type: DataTypes.STRING,
    },
    password_reset_token: {
        type: DataTypes.STRING,
    },
    password_reset_expires: {
        type: DataTypes.DATE,
    },
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
    },
});

User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
