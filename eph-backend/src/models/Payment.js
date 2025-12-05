// src/models/Payment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique order ID for payment tracking'
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Payment gateway transaction ID'
    },
    registration_id: {
      type: DataTypes.UUID,
      allowNull: true, // Allow null for payment orders created before registration
      references: {
        model: 'registrations',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    competition_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'competitions',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Payment amount in INR'
    },
    original_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Original amount before discount'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Discount amount applied from coupon'
    },
    coupon_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Applied coupon for this payment'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR'
    },
    user_type: {
      type: DataTypes.ENUM('undergraduate', 'graduate'),
      allowNull: false,
      comment: 'User education level for pricing'
    },
    team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Number of team members for amount calculation'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    gateway_response: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Payment gateway response data'
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Payment method used (card, upi, netbanking, etc.)'
    },
    gateway_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Payment gateway specific order ID'
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Payment gateway signature for verification'
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when payment was completed'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Payment order expiration time'
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for payment failure'
    },
    refund_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Refund transaction ID if applicable'
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when refund was processed'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['order_id'],
        unique: true
      },
      {
        fields: ['payment_id']
      },
      {
        fields: ['registration_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['competition_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods
  Payment.prototype.isCompleted = function () {
    return this.status === 'completed';
  };

  Payment.prototype.isPending = function () {
    return this.status === 'pending' || this.status === 'processing';
  };

  Payment.prototype.isFailed = function () {
    return this.status === 'failed' || this.status === 'cancelled';
  };

  Payment.prototype.canRefund = function () {
    return this.status === 'completed' && !this.refund_id;
  };

  Payment.prototype.isExpired = function () {
    return this.expires_at && new Date() > new Date(this.expires_at);
  };

  return Payment;
};