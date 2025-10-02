'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registrations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      competition_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'competitions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('individual', 'team'),
        allowNull: false,
        defaultValue: 'individual'
      },
      team_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      leader_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      members: {
        type: Sequelize.ARRAY(Sequelize.UUID),
        defaultValue: [],
        allowNull: false
      },
      abstract: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'waitlisted', 'rejected', 'withdrawn'),
        defaultValue: 'pending',
        allowNull: false
      },
      submission_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      stage_progress: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      registered_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      confirmed_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('registrations', ['competition_id']);
    await queryInterface.addIndex('registrations', ['leader_id']);
    await queryInterface.addIndex('registrations', ['status']);
    await queryInterface.addIndex('registrations', ['type']);
    await queryInterface.addIndex('registrations', ['members'], { using: 'gin' });
    await queryInterface.addIndex('registrations', ['competition_id', 'leader_id'], { unique: true });
    await queryInterface.addIndex('registrations', ['rank']);

    // Create junction table for registration members
    await queryInterface.createTable('registration_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      registration_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'registrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('registration_members', ['registration_id', 'user_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('registration_members');
    await queryInterface.dropTable('registrations');
  }
};