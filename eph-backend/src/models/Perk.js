// src/models/perk.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Perk = sequelize.define('Perk', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    xp_required: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    type: {
      type: DataTypes.ENUM('discount', 'freebie', 'access', 'course', 'mentorship', 'certification'),
      allowNull: false
    },
    category: { type: DataTypes.STRING(100), allowNull: true },
    value: { type: DataTypes.STRING(50), allowNull: true },
    max_redemptions: { type: DataTypes.INTEGER, allowNull: true },
    redemptions_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    sponsor_info: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    terms_conditions: { type: DataTypes.TEXT, allowNull: true },
    redemption_instructions: { type: DataTypes.TEXT, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    external_url: { type: DataTypes.TEXT, allowNull: true }, // Main redemption URL
    promo_code: { type: DataTypes.STRING(100), allowNull: true }, // Redemption code
    valid_from: { type: DataTypes.DATE, allowNull: true },
    valid_until: { type: DataTypes.DATE, allowNull: true },
    target_roles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['student']
    },
    is_featured: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
  }, {
    tableName: 'perks',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['type'] },
      { fields: ['xp_required'] },
      { fields: ['is_active', 'is_featured'] },
      { fields: ['valid_from', 'valid_until'] },
      { fields: ['category'] },
      { fields: ['created_by'] }
    ]
  });

  // Instance helpers
  Perk.prototype.isAvailable = function () {
    const now = new Date();
    if (!this.is_active) return false;
    if (this.valid_from && new Date(this.valid_from) > now) return false;
    if (this.valid_until && new Date(this.valid_until) < now) return false;
    if (this.max_redemptions !== null && typeof this.max_redemptions !== 'undefined') {
      if ((this.redemptions_count || 0) >= this.max_redemptions) return false;
    }
    return true;
  };

  Perk.prototype.canUserRedeem = function (userXP) {
    return this.isAvailable() && (userXP || 0) >= (this.xp_required || 0);
  };

  Perk.prototype.canBeRedeemedBy = function (user) {
    if (!this.isAvailable()) return false;
    if (!user) return false;
    if (Array.isArray(this.target_roles) && this.target_roles.length) {
      if (!this.target_roles.includes(user.role)) return false;
    }
    return (user.xp || 0) >= (this.xp_required || 0);
  };

  // UPDATED: Enhanced toPublicJSON with redemption context
  Perk.prototype.toPublicJSON = function (userRole = 'student', userRedemption = null) {
    const p = this.toJSON ? this.toJSON() : { ...this };
    const baseData = {
      id: p.id,
      title: p.title,
      description: p.description,
      xp_required: p.xp_required,
      type: p.type,
      category: p.category,
      value: p.value,
      max_redemptions: p.max_redemptions,
      redemptions_count: p.redemptions_count,
      sponsor_info: p.sponsor_info,
      terms_conditions: p.terms_conditions,
      redemption_instructions: p.redemption_instructions,
      image_url: p.image_url,
      is_featured: p.is_featured,
      is_active: p.is_active,
      target_roles: p.target_roles,
      remaining_redemptions: (p.max_redemptions === null || typeof p.max_redemptions === 'undefined') 
        ? null : Math.max(0, (p.max_redemptions - (p.redemptions_count || 0))),
      days_remaining: p.valid_until 
        ? Math.ceil((new Date(p.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    // Include redemption details if user has redeemed this perk
    if (userRedemption) {
      baseData.is_redeemed = true;
      baseData.redeemed_at = userRedemption.createdAt || userRedemption.redeemed_at;
      baseData.external_url = p.external_url; // Show redemption URL
      baseData.promo_code = p.promo_code; // Show redemption code
    } else {
      baseData.is_redeemed = false;
      // Don't expose redemption details until redeemed
    }

    return baseData;
  };

  // Static helpers
  Perk.findAvailableFor = function (user) {
    const now = new Date();
    const where = {
      is_active: true,
      [sequelize.Sequelize.Op.or]: [
        { valid_from: { [sequelize.Sequelize.Op.lte]: now } },
        { valid_from: null }
      ],
      [sequelize.Sequelize.Op.or]: [
        { valid_until: { [sequelize.Sequelize.Op.gte]: now } },
        { valid_until: null }
      ]
    };

    return this.findAll({ where, order: [['xp_required', 'ASC'], ['created_at', 'DESC']] });
  };

  Perk.getPopular = function (limit = 10) {
    return this.findAll({
      where: { is_active: true },
      order: [['redemptions_count', 'DESC']],
      limit
    });
  };

  return Perk;
};