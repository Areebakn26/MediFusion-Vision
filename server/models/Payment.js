const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // appointment_id handled by association
    payment_intent_id: {
        type: DataTypes.STRING,
        unique: true,
    },
    stripe_customer_id: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'pkr',
    },
    payment_method: {
        type: DataTypes.ENUM('card', 'wallet', 'bank_transfer'),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded'),
        defaultValue: 'pending',
    },
    transaction_id: {
        type: DataTypes.STRING,
    },
    refund_id: {
        type: DataTypes.STRING,
    },
    refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
    },
    refund_reason: {
        type: DataTypes.TEXT,
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
});

module.exports = Payment;
