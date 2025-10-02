'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('competitions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      source_type: {
        type: Sequelize.ENUM('company', 'hackathon', 'university'),
        allowNull: false
      },
      sponsor: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      registration_deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      max_team_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      total_seats: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      seats_remaining: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      stages: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: [],
        allowNull: false
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false
      },
      prize_pool: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      banner_image_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rules: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      eligibility_criteria: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      contact_info: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled'),
        defaultValue: 'draft',
        allowNull: false
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('competitions', ['status']);
    await queryInterface.addIndex('competitions', ['source_type']);
    await queryInterface.addIndex('competitions', ['start_date', 'end_date']);
    await queryInterface.addIndex('competitions', ['registration_deadline']);
    await queryInterface.addIndex('competitions', ['tags'], { using: 'gin' });
    await queryInterface.addIndex('competitions', ['is_featured']);
    await queryInterface.addIndex('competitions', ['created_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('competitions');
  }
};