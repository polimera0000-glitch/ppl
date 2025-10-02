// migrations/20250928-add-admin-fields-to-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'last_ip', {
      type: Sequelize.INET,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'last_login_device', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'super_admin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    await queryInterface.addColumn('users', 'permissions', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'last_ip');
    await queryInterface.removeColumn('users', 'last_login_device');
    await queryInterface.removeColumn('users', 'notes');
    await queryInterface.removeColumn('users', 'super_admin');
    await queryInterface.removeColumn('users', 'permissions');
  }
};
