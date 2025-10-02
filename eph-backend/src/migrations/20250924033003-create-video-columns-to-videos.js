
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('videos', 'summary', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('videos', 'repo_url', {
      type: Sequelize.STRING(512),
      allowNull: true,
      validate: { isUrl: true }
    });
    await queryInterface.addColumn('videos', 'drive_url', {
      type: Sequelize.STRING(512),
      allowNull: true,
      validate: { isUrl: true }
    });
    await queryInterface.addColumn('videos', 'attachments', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('videos', 'summary');
    await queryInterface.removeColumn('videos', 'repo_url');
    await queryInterface.removeColumn('videos', 'drive_url');
    await queryInterface.removeColumn('videos', 'attachments');
  }
};
