'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('payments', 'registration_id', {
      type: Sequelize.UUID,
      allowNull: true, // Make registration_id nullable
      references: {
        model: 'registrations',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('payments', 'registration_id', {
      type: Sequelize.UUID,
      allowNull: false, // Revert back to not null
      references: {
        model: 'registrations',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });
  }
};