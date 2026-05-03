const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModelVersion = sequelize.define('ModelVersion', {
    version_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    model_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    version_tag: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    file_path: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    accuracy: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    deployed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'model_versions',
    timestamps: true,
});

module.exports = ModelVersion;
