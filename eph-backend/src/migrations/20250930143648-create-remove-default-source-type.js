// migrations/XXXXXXXXXXXX-remove-default-source-type.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the default from source_type
    await queryInterface.changeColumn('competitions', 'source_type', {
      type: Sequelize.ENUM('internal', 'external', 'partner'),
      allowNull: false,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore the default to 'internal' (rollback)
    await queryInterface.changeColumn('competitions', 'source_type', {
      type: Sequelize.ENUM('internal', 'external', 'partner'),
      allowNull: false,
      defaultValue: 'internal'
    });
  }
};
