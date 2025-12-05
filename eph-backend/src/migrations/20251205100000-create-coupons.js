'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique coupon code'
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        comment: 'Discount percentage (0-100)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether the coupon is currently active'
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Start date for coupon validity'
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'End date for coupon validity'
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum number of times this coupon can be used (null = unlimited)'
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of times this coupon has been used'
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
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('coupons', ['code'], { unique: true });
    await queryInterface.addIndex('coupons', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('coupons');
  }
};
