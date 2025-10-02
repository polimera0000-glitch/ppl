'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('videos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      uploader_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(140),
        allowNull: true
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      length_sec: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false
      },
      visibility_roles: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: ['uploader', 'hiring', 'investor', 'admin'],
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      file_format: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      processing_status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      transcoding_job_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      views_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      likes_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('videos', ['uploader_id']);
    await queryInterface.addIndex('videos', ['processing_status']);
    await queryInterface.addIndex('videos', ['is_active', 'created_at']);
    await queryInterface.addIndex('videos', ['tags'], { using: 'gin' });
    await queryInterface.addIndex('videos', ['visibility_roles'], { using: 'gin' });
    await queryInterface.addIndex('videos', ['views_count']);
    await queryInterface.addIndex('videos', ['is_featured']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('videos');
  }
};