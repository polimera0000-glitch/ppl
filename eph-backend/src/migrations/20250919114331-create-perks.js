'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('perks', {
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
      xp_required: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('discount', 'freebie', 'access', 'course', 'mentorship', 'certification'),
        allowNull: false
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      value: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      max_redemptions: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      redemptions_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      sponsor_info: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      terms_conditions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      redemption_instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      external_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      promo_code: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: true
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('perks', ['type']);
    await queryInterface.addIndex('perks', ['xp_required']);
    await queryInterface.addIndex('perks', ['is_active', 'is_featured']);
    await queryInterface.addIndex('perks', ['valid_from', 'valid_until']);
    await queryInterface.addIndex('perks', ['category']);
    await queryInterface.addIndex('perks', ['created_by']);

    // Create junction table for user perks
    await queryInterface.createTable('user_perks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
      perk_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'perks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      redeemed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
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

    await queryInterface.addIndex('user_perks', ['user_id', 'perk_id'], { unique: true });
    await queryInterface.addIndex('user_perks', ['redeemed_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_perks');
    await queryInterface.dropTable('perks');
  }
};