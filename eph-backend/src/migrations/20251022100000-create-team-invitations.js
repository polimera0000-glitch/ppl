'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum for invitation status
    await queryInterface.sequelize.query(`
      CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'expired');
    `);

    // Create team_invitations table
    await queryInterface.createTable('team_invitations', {
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
      inviter_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      invitee_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      invitee_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected', 'expired'),
        defaultValue: 'pending',
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      responded_at: {
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
    await queryInterface.addIndex('team_invitations', ['registration_id'], {
      name: 'idx_team_invitations_registration_id'
    });
    
    await queryInterface.addIndex('team_invitations', ['token'], {
      name: 'idx_team_invitations_token',
      unique: true
    });
    
    await queryInterface.addIndex('team_invitations', ['status'], {
      name: 'idx_team_invitations_status'
    });
    
    await queryInterface.addIndex('team_invitations', ['expires_at'], {
      name: 'idx_team_invitations_expires_at'
    });

    await queryInterface.addIndex('team_invitations', ['invitee_email'], {
      name: 'idx_team_invitations_invitee_email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('team_invitations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS invitation_status_enum;');
  }
};