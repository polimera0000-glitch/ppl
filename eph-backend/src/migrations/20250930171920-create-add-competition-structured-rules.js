'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Dates for richer timeline
    await queryInterface.addColumn('competitions', 'registration_start_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('competitions', 'results_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Long/markdown fields
    await queryInterface.addColumn('competitions', 'description_long', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('competitions', 'rules_markdown', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Structured JSONB blocks (all nullable with sensible defaults)
    await queryInterface.addColumn('competitions', 'team_limits', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addColumn('competitions', 'submission_limits', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addColumn('competitions', 'evaluation', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addColumn('competitions', 'code_requirements', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addColumn('competitions', 'external_data_policy', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addColumn('competitions', 'winner_license', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
    await queryInterface.addColumn('competitions', 'data_access', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });

    // Optional: richer prize breakdown & resources links
    await queryInterface.addColumn('competitions', 'prizes', {
      type: Sequelize.JSONB, // array of {place, amount}
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn('competitions', 'resources', {
      type: Sequelize.JSONB, // array of {label, url}
      allowNull: true,
      defaultValue: [],
    });

    // Helpful indexes
    await queryInterface.addIndex('competitions', ['registration_start_date']);
    await queryInterface.addIndex('competitions', ['results_date']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('competitions', ['results_date']);
    await queryInterface.removeIndex('competitions', ['registration_start_date']);

    await queryInterface.removeColumn('competitions', 'resources');
    await queryInterface.removeColumn('competitions', 'prizes');

    await queryInterface.removeColumn('competitions', 'data_access');
    await queryInterface.removeColumn('competitions', 'winner_license');
    await queryInterface.removeColumn('competitions', 'external_data_policy');
    await queryInterface.removeColumn('competitions', 'code_requirements');
    await queryInterface.removeColumn('competitions', 'evaluation');
    await queryInterface.removeColumn('competitions', 'submission_limits');
    await queryInterface.removeColumn('competitions', 'team_limits');

    await queryInterface.removeColumn('competitions', 'rules_markdown');
    await queryInterface.removeColumn('competitions', 'description_long');

    await queryInterface.removeColumn('competitions', 'results_date');
    await queryInterface.removeColumn('competitions', 'registration_start_date');
  }
};
