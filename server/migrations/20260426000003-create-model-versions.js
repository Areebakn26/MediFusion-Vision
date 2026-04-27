'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('model_versions', {
      version_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      model_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      version_tag: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      accuracy: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      deployed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('model_versions');
  },
};
