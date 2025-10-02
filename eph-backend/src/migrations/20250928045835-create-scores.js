'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('scores', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      submission_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'submissions', key: 'id' }, onDelete: 'CASCADE'
      },
      judge_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
      },
      criterion_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'judging_criteria', key: 'id' }, onDelete: 'CASCADE'
      },
      score: { type: Sequelize.FLOAT, allowNull: false },
      comment: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.addConstraint('scores', {
      type: 'unique',
      fields: ['submission_id', 'judge_id', 'criterion_id'],
      name: 'scores_unique_submission_judge_criterion'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('scores');
  }
};
