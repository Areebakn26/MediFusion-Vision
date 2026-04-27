'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('retraining_jobs', {
      job_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      triggered_by: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      trigger_reason: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending',
        allowNull: false,
      },
      feedback_count_used: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      old_model_version: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      new_model_version: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
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
    await queryInterface.dropTable('retraining_jobs');
  },
};
