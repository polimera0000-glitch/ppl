'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('submissions', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      competition_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'competitions', key: 'id' }, onDelete: 'CASCADE'
      },
      leader_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE'
      },
      team_name: { type: Sequelize.STRING },
      title: { type: Sequelize.STRING, allowNull: false },
      summary: { type: Sequelize.TEXT },
      repo_url: { type: Sequelize.TEXT },
      drive_url: { type: Sequelize.TEXT },
      video_url: { type: Sequelize.TEXT },
      zip_url: { type: Sequelize.TEXT },
      attachments_json: { type: Sequelize.TEXT }, // JSON string (array of URLs)
      status: {
        type: Sequelize.ENUM('submitted','under_review','needs_changes','disqualified','shortlisted','winner','not_winner','published'),
        allowNull: false, defaultValue: 'submitted'
      },
      final_score: { type: Sequelize.FLOAT },
      feedback: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('submissions', ['competition_id']);
    await queryInterface.addIndex('submissions', ['leader_id']);
    await queryInterface.addIndex('submissions', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('submissions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_submissions_status";');
  }
};
