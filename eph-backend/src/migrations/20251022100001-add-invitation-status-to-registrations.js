'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum for invitation completion status
    await queryInterface.sequelize.query(`
      CREATE TYPE invitation_completion_enum AS ENUM ('complete', 'pending_invitations');
    `);

    // Add invitation_status column to registrations table
    await queryInterface.addColumn('registrations', 'invitation_status', {
      type: Sequelize.ENUM('complete', 'pending_invitations'),
      defaultValue: 'complete',
      allowNull: false
    });

    // Create index for invitation_status
    await queryInterface.addIndex('registrations', ['invitation_status'], {
      name: 'idx_registrations_invitation_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('registrations', 'invitation_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS invitation_completion_enum;');
  }
};