// migrations/YYYY-MM-DD-add-force-password-change-to-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'force_password_change', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Forces user to change password on next login (used for new admin invites)'
    });

    // Add index for faster queries
    await queryInterface.addIndex('users', ['force_password_change'], {
      name: 'idx_users_force_password_change'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_force_password_change');
    await queryInterface.removeColumn('users', 'force_password_change');
  }
};