const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    // appointment_id handled by association
    stripe_payment_intent_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'usd',
    },
    refund_status: {
        type: DataTypes.ENUM('none', 'partial', 'full', 'failed'),
        defaultValue: 'none',
    },
    refund_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    refund_transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    refund_initiated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    refund_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    payment_method_details: {
        type: DataTypes.JSONB,
        defaultValue: {},
    },
});

module.exports = PaymentTransaction;
