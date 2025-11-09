/* eslint-disable no-unused-vars */
'use strict';

/**
 * Add new timeline and evaluation columns to competitions table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('competitions', 'abstract_submission_start_date', { type: Sequelize.DATE, allowNull: true }),
      queryInterface.addColumn('competitions', 'abstract_submission_end_date', { type: Sequelize.DATE, allowNull: true }),
      queryInterface.addColumn('competitions', 'shortlisted_candidates_date', { type: Sequelize.DATE, allowNull: true }),

      queryInterface.addColumn('competitions', 'prototype_submission_start_date', { type: Sequelize.DATE, allowNull: true }),
      queryInterface.addColumn('competitions', 'prototype_submission_end_date', { type: Sequelize.DATE, allowNull: true }),

      queryInterface.addColumn('competitions', 'pitch_deck_start_date', { type: Sequelize.DATE, allowNull: true }),
      queryInterface.addColumn('competitions', 'pitch_deck_end_date', { type: Sequelize.DATE, allowNull: true }),

      queryInterface.addColumn('competitions', 'final_round_date', { type: Sequelize.DATE, allowNull: true }),

      queryInterface.addColumn('competitions', 'evaluation_metrics', { type: Sequelize.TEXT, allowNull: true }),
    ]);
  },

  down: async (queryInterface /* , Sequelize */) => {
    await Promise.all([
      queryInterface.removeColumn('competitions', 'abstract_submission_start_date'),
      queryInterface.removeColumn('competitions', 'abstract_submission_end_date'),
      queryInterface.removeColumn('competitions', 'shortlisted_candidates_date'),

      queryInterface.removeColumn('competitions', 'prototype_submission_start_date'),
      queryInterface.removeColumn('competitions', 'prototype_submission_end_date'),

      queryInterface.removeColumn('competitions', 'pitch_deck_start_date'),
      queryInterface.removeColumn('competitions', 'pitch_deck_end_date'),

      queryInterface.removeColumn('competitions', 'final_round_date'),

      queryInterface.removeColumn('competitions', 'evaluation_metrics'),
    ]);
  }
};
