'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PatientProfiles', 'accessibility_settings', {
      type: Sequelize.JSONB,
      defaultValue: {}
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('PatientProfiles', 'accessibility_settings');
  }
};
