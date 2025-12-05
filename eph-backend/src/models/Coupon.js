module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique coupon code'
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'Discount percentage (0-100)',
      validate: {
        min: 0,
        max: 100
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether the coupon is currently active'
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Start date for coupon validity'
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'End date for coupon validity'
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum number of times this coupon can be used (null = unlimited)'
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of times this coupon has been used'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'coupons',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Coupon;
};
