// src/models/userPerk.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPerk = sequelize.define('UserPerk', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
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
    perk_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'perks',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    redeemed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    // Store redemption details snapshot in case perk details change later
    redemption_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'user_perks',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['perk_id'] },
      { fields: ['user_id', 'perk_id'], unique: true }, // Prevent duplicate redemptions
      { fields: ['redeemed_at'] }
    ]
  });

  return UserPerk;
};