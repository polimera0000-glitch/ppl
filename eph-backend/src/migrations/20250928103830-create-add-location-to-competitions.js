// migrations/20250928-add-location-to-competitions.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('competitions', 'location', { type: Sequelize.STRING(255), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('competitions', 'location');
  }
};
