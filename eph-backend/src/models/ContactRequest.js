'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContactRequest = sequelize.define('ContactRequest', {
    id: {
      type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4,
      primaryKey: true, allowNull: false,
    },
    sender_id: { type: DataTypes.UUID, allowNull: false },
    sender_role: { type: DataTypes.ENUM('hiring', 'investor', 'admin'), allowNull: false },

    recipient_id: { type: DataTypes.UUID, allowNull: false },

    submission_id: { type: DataTypes.UUID, allowNull: true },

    subject: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },

    sender_company_name: { type: DataTypes.STRING(255), allowNull: true },
    sender_firm_name: { type: DataTypes.STRING(255), allowNull: true },

    contact_email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    contact_phone: { type: DataTypes.STRING(50), allowNull: true },

    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'closed'),
      allowNull: false, defaultValue: 'pending',
    },

    seen_at: { type: DataTypes.DATE, allowNull: true },
    replied_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'contact_requests',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  ContactRequest.associate = (models) => {
    ContactRequest.belongsTo(models.User, { as: 'sender', foreignKey: 'sender_id' });
    ContactRequest.belongsTo(models.User, { as: 'recipient', foreignKey: 'recipient_id' });
    if (models.Submission) {
      ContactRequest.belongsTo(models.Submission, { as: 'submission', foreignKey: 'submission_id' });
    }
  };

  return ContactRequest;
};
