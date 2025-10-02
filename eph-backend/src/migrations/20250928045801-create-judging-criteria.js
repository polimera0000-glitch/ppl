'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('judging_criteria', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      competition_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'competitions', key: 'id' }, onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: false },
      weight: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 1 },
      max_score: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 10 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('judging_criteria', ['competition_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('judging_criteria');
  }
};
