// src/migrations/XXXX-add-target-roles-to-perks.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('perks', 'target_roles', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: ['student']
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('perks', 'target_roles');
  }
};
