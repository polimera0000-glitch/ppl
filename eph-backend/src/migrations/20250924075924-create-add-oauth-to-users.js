// migrations/YYYYMMDD-add-oauth-to-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add OAuth columns to users table
    await queryInterface.addColumn('users', 'oauth_provider', {
      type: Sequelize.ENUM('google', 'github'),
      allowNull: true,
      after: 'is_active' // Position after is_active column
    });

    await queryInterface.addColumn('users', 'oauth_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'oauth_provider'
    });

    // Add index for OAuth lookups
    await queryInterface.addIndex('users', ['oauth_provider', 'oauth_id'], {
      name: 'users_oauth_provider_id_idx'
    });

    // Modify password_hash to allow OAuth placeholder values
    // This allows users created via OAuth to have placeholder password hashes
    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('users', 'users_oauth_provider_id_idx');
    
    // Remove OAuth columns
    await queryInterface.removeColumn('users', 'oauth_id');
    await queryInterface.removeColumn('users', 'oauth_provider');
    
    // Revert password_hash column changes if needed
    await queryInterface.changeColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    });
  }
};