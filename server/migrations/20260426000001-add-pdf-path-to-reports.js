'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Reports', 'pdf_path', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Reports', 'pdf_generated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Reports', 'pdf_generated_at');
    await queryInterface.removeColumn('Reports', 'pdf_path');
  }
};
