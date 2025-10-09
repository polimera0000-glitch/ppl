// src/models/EmailVerificationToken.js
module.exports = (sequelize, DataTypes) => {
  const EmailVerificationToken = sequelize.define(
    'EmailVerificationToken',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
    },
    {
      tableName: 'email_verification_tokens',
      underscored: true,
      indexes: [{ fields: ['user_id'] }, { fields: ['token'], unique: true }],
    }
  );

  EmailVerificationToken.associate = (models) => {
    EmailVerificationToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  EmailVerificationToken.prototype.markAsUsed = async function () {
    this.used_at = new Date();
    await this.save();
    return this;
  };

  return EmailVerificationToken;
};
