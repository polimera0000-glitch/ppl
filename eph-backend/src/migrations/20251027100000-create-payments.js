'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Unique order ID for payment tracking'
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Payment gateway transaction ID'
      },
      registration_id: {
        type: Sequelize.UUID,
        allowNull: true, // Allow null initially, will be set after registration
        references: {
          model: 'registrations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      competition_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'competitions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Payment amount in INR'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR'
      },
      user_type: {
        type: Sequelize.ENUM('undergraduate', 'graduate'),
        allowNull: false,
        comment: 'User education level for pricing'
      },
      team_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Number of team members for amount calculation'
      },
      team_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Team name for team registrations'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      gateway_response: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Payment gateway response data'
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Payment method used (card, upi, netbanking, etc.)'
      },
      gateway_order_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Payment gateway specific order ID'
      },
      signature: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Payment gateway signature for verification'
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when payment was completed'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Payment order expiration time'
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for payment failure'
      },
      refund_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Refund transaction ID if applicable'
      },
      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when refund was processed'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('payments', ['order_id'], {
      name: 'idx_payments_order_id',
      unique: true
    });

    await queryInterface.addIndex('payments', ['payment_id'], {
      name: 'idx_payments_payment_id'
    });

    await queryInterface.addIndex('payments', ['registration_id'], {
      name: 'idx_payments_registration_id'
    });

    await queryInterface.addIndex('payments', ['user_id'], {
      name: 'idx_payments_user_id'
    });

    await queryInterface.addIndex('payments', ['competition_id'], {
      name: 'idx_payments_competition_id'
    });

    await queryInterface.addIndex('payments', ['status'], {
      name: 'idx_payments_status'
    });

    await queryInterface.addIndex('payments', ['created_at'], {
      name: 'idx_payments_created_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  }
};