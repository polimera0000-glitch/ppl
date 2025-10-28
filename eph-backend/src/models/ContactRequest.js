'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ContactRequest = sequelize.define('ContactRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // app-side UUID; DB has defaults too via migration
      primaryKey: true,
      allowNull: false,
    },

    // who is contacting
    sender_id: { type: DataTypes.UUID, allowNull: false },
    sender_role: { type: DataTypes.ENUM('hiring', 'investor', 'admin'), allowNull: false },

    // who is being contacted
    recipient_id: { type: DataTypes.UUID, allowNull: false },

    // optional link to a submission/project
    submission_id: { type: DataTypes.UUID, allowNull: true },

    subject: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },

    // snapshot sender details
    sender_company_name: { type: DataTypes.STRING(255), allowNull: true },
    sender_firm_name: { type: DataTypes.STRING(255), allowNull: true },

    // reply-to details
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: true },
      set(v) { if (typeof v === 'string') this.setDataValue('contact_email', v.trim().toLowerCase()); },
    },
    contact_phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: { len: [0, 50] },
    },

    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'closed'),
      allowNull: false,
      defaultValue: 'pending',
    },

    seen_at: { type: DataTypes.DATE, allowNull: true },
    replied_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'contact_requests',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { name: 'contact_requests_recipient_status_idx', fields: ['recipient_id', 'status'] },
      { name: 'contact_requests_sender_idx', fields: ['sender_id'] },
      { name: 'contact_requests_submission_idx', fields: ['submission_id'] },
    ],
  });

  ContactRequest.associate = (models) => {
    ContactRequest.belongsTo(models.User, {
      as: 'sender',
      foreignKey: 'sender_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    ContactRequest.belongsTo(models.User, {
      as: 'recipient',
      foreignKey: 'recipient_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    if (models.Submission) {
      ContactRequest.belongsTo(models.Submission, {
        as: 'submission',
        foreignKey: 'submission_id',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  };

  return ContactRequest;
};
