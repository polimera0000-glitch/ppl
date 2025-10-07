'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'company_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'company_website', {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'team_size', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'firm_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'investment_stage', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'e.g., pre-seed, seed, Series A',
    });
    await queryInterface.addColumn('users', 'website', {
      type: Sequelize.STRING(512),
      allowNull: true,
    });

    // helpful indexes for searching
    await queryInterface.addIndex('users', ['company_name']);
    await queryInterface.addIndex('users', ['firm_name']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', ['company_name']);
    await queryInterface.removeIndex('users', ['firm_name']);

    await queryInterface.removeColumn('users', 'website');
    await queryInterface.removeColumn('users', 'investment_stage');
    await queryInterface.removeColumn('users', 'firm_name');
    await queryInterface.removeColumn('users', 'team_size');
    await queryInterface.removeColumn('users', 'company_website');
    await queryInterface.removeColumn('users', 'company_name');
  },
};
