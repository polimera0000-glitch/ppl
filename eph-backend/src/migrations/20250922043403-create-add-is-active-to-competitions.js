'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add column is_active with default true
    return queryInterface.addColumn('competitions', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('competitions', 'is_active');
  }
};
