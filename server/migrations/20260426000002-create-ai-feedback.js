'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_feedback', {
      feedback_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      scan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Scans', key: 'id' },
        onDelete: 'CASCADE',
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Doctors', key: 'id' },
        onDelete: 'CASCADE',
      },
      model_version: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      ai_prediction: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      ai_confidence: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
      },
      corrected_diagnosis: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      doctor_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      feedback_reason: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      quality_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      },
      consensus_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      validation_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending',
        allowNull: false,
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
    await queryInterface.dropTable('ai_feedback');
  },
};
