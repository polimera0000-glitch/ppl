// migrations/20250928-add-optional-contact-to-users.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone', { type: Sequelize.STRING(32), allowNull: true });
    await queryInterface.addColumn('users', 'org', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('users', 'country', { type: Sequelize.STRING(100), allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'org');
    await queryInterface.removeColumn('users', 'country');
  }
};
