const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const TeamInvitation = sequelize.define('TeamInvitation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    registration_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'registrations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    inviter_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    invitee_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    invitee_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
      defaultValue: 'pending',
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'team_invitations',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['registration_id']
      },
      {
        fields: ['token'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['invitee_email']
      }
    ],
    hooks: {
      beforeCreate: async (invitation) => {
        // Generate secure token if not provided
        if (!invitation.token) {
          invitation.token = crypto.randomBytes(32).toString('hex');
        }
        
        // Set expiration date if not provided (7 days from now)
        if (!invitation.expires_at) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 7);
          invitation.expires_at = expirationDate;
        }
      },
      beforeSave: async (invitation) => {
        // Auto-set responded_at when status changes from pending
        if (invitation.changed('status') && 
            invitation.status !== 'pending' && 
            !invitation.responded_at) {
          invitation.responded_at = new Date();
        }
      }
    }
  });

  // Associations
  TeamInvitation.associate = (models) => {
    TeamInvitation.belongsTo(models.Registration, {
      foreignKey: 'registration_id',
      as: 'registration'
    });
    
    TeamInvitation.belongsTo(models.User, {
      foreignKey: 'inviter_id',
      as: 'inviter'
    });
    
    TeamInvitation.belongsTo(models.User, {
      foreignKey: 'invitee_id',
      as: 'invitee'
    });
  };

  // Instance methods
  TeamInvitation.prototype.isExpired = function() {
    return new Date() > this.expires_at;
  };

  TeamInvitation.prototype.canRespond = function() {
    return this.status === 'pending' && !this.isExpired();
  };

  TeamInvitation.prototype.accept = async function(userId = null) {
    if (!this.canRespond()) {
      throw new Error('Invitation cannot be accepted');
    }
    
    this.status = 'accepted';
    this.responded_at = new Date();
    if (userId) {
      this.invitee_id = userId;
    }
    
    await this.save(['status', 'responded_at', 'invitee_id']);
    return this;
  };

  TeamInvitation.prototype.reject = async function(userId = null) {
    if (!this.canRespond()) {
      throw new Error('Invitation cannot be rejected');
    }
    
    this.status = 'rejected';
    this.responded_at = new Date();
    if (userId) {
      this.invitee_id = userId;
    }
    
    await this.save(['status', 'responded_at', 'invitee_id']);
    return this;
  };

  TeamInvitation.prototype.markExpired = async function() {
    if (this.status === 'pending') {
      this.status = 'expired';
      await this.save(['status']);
    }
    return this;
  };

  // Class methods
  TeamInvitation.generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
  };

  TeamInvitation.findByToken = function(token) {
    return this.findOne({
      where: { token },
      include: [
        { model: sequelize.models.Registration, as: 'registration' },
        { model: sequelize.models.User, as: 'inviter' }
      ]
    });
  };

  TeamInvitation.findByRegistration = function(registrationId) {
    return this.findAll({
      where: { registration_id: registrationId },
      include: [
        { model: sequelize.models.User, as: 'inviter' },
        { model: sequelize.models.User, as: 'invitee' }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  TeamInvitation.findPendingByEmail = function(email) {
    return this.findAll({
      where: {
        invitee_email: email,
        status: 'pending'
      },
      include: [
        { model: sequelize.models.Registration, as: 'registration' },
        { model: sequelize.models.User, as: 'inviter' }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  TeamInvitation.findExpired = function() {
    return this.findAll({
      where: {
        status: 'pending',
        expires_at: { [sequelize.Sequelize.Op.lt]: new Date() }
      }
    });
  };

  TeamInvitation.cleanupExpired = async function() {
    const expiredInvitations = await this.findExpired();
    
    for (const invitation of expiredInvitations) {
      await invitation.markExpired();
    }
    
    return expiredInvitations.length;
  };

  return TeamInvitation;
};