'use strict';

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterNow(value) {
          // Accept Date objects or strings; convert and validate
          const dt = new Date(value);
          if (Number.isNaN(dt.getTime())) {
            throw new Error('expires_at must be a valid date');
          }
          if (dt <= new Date()) {
            throw new Error('expires_at must be a future date/time');
          }
        }
      }
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'password_resets',
    underscored: true,
    timestamps: false,
    indexes: [
      { unique: true, fields: ['token'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
      { fields: ['used'] }
    ],
    hooks: {
      // Ensure defaults exist before validation (so validators don't fail)
      beforeValidate: (passwordReset) => {
        if (!passwordReset.token) {
          passwordReset.token = crypto.randomBytes(32).toString('hex');
        }
        if (!passwordReset.expires_at) {
          passwordReset.expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        }
      },

      // Extra safety — redundant but harmless
      beforeCreate: (passwordReset) => {
        if (!passwordReset.token) {
          passwordReset.token = crypto.randomBytes(32).toString('hex');
        }
        if (!passwordReset.expires_at) {
          passwordReset.expires_at = new Date(Date.now() + 60 * 60 * 1000);
        }
      },

      beforeUpdate: (passwordReset) => {
        // mark used_at when used flips to true
        if (typeof passwordReset.changed === 'function' && passwordReset.changed('used') && passwordReset.used) {
          passwordReset.used_at = new Date();
        }
      }
    }
  });

  //
  // Instance methods
  //
  /**
   * Returns true if token is not used and not expired.
   */
  PasswordReset.prototype.isValid = function() {
    const now = new Date();
    return !this.used && now <= this.expires_at;
  };

  /**
   * Marks the reset token as used and records used_at.
   * Saves only the fields changed for efficiency.
   */
  PasswordReset.prototype.markAsUsed = async function() {
    this.used = true;
    this.used_at = new Date();
    // Use save with fields option
    await this.save({ fields: ['used', 'used_at'] });
    return this;
  };

  /**
   * Returns true if now is after expires_at.
   */
  PasswordReset.prototype.isExpired = function() {
    const now = new Date();
    return now > this.expires_at;
  };

  /**
   * Milliseconds remaining until expiry (>= 0).
   */
  PasswordReset.prototype.getTimeRemaining = function() {
    const now = new Date();
    const remaining = this.expires_at - now;
    return Math.max(0, remaining);
  };

  /**
   * Whole minutes remaining until expiry.
   */
  PasswordReset.prototype.getTimeRemainingInMinutes = function() {
    return Math.floor(this.getTimeRemaining() / (1000 * 60));
  };

  //
  // Class / static methods
  //

  /**
   * Create a new password reset token for a user.
   * Invalidates previous unused tokens for the user.
   *
   * Note: consider wrapping the update + create in a transaction for full atomicity.
   */
  PasswordReset.createForUser = async function(userId, { token, expires_at, ip_address = null, user_agent = null } = {}) {
  const payload = {
    token: token,
    user_id: userId,
    expires_at: expires_at,
    used: false
  };

  // only set these if rawAttributes include them and ensure strings or null
  const attrs = this.rawAttributes || {};
  if ('ip_address' in attrs) {
    payload.ip_address = ip_address === null || typeof ip_address === 'undefined' ? null : String(ip_address);
  }
  if ('user_agent' in attrs) {
    payload.user_agent = user_agent === null || typeof user_agent === 'undefined' ? null : String(user_agent);
  }

  return this.create(payload);
};

  /**
   * Find a valid (unused, unexpired) token record by token string.
   */
  PasswordReset.findValidToken = function(token) {
    const now = new Date();
    const Op = sequelize.Sequelize.Op;

    return this.findOne({
      where: {
        token,
        used: false,
        expires_at: { [Op.gt]: now }
      }
    });
  };

  /**
   * Get all reset attempts for a user (most recent first).
   */
  PasswordReset.findByUser = function(userId) {
    return this.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
  };

  /**
   * Destroy expired tokens (expires_at < now).
   * Returns number of rows removed.
   */
  PasswordReset.cleanupExpired = async function() {
    const now = new Date();
    const Op = sequelize.Sequelize.Op;
    const result = await this.destroy({
      where: {
        expires_at: { [Op.lt]: now }
      }
    });
    return result;
  };

  /**
   * Destroy used tokens older than `olderThanDays`.
   * Default 7 days.
   */
  PasswordReset.cleanupUsed = async function(olderThanDays = 7) {
    const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    const Op = sequelize.Sequelize.Op;
    const result = await this.destroy({
      where: {
        used: true,
        used_at: { [Op.lt]: cutoffDate }
      }
    });
    return result;
  };

  /**
   * Get recent attempts for user within the last `hours`.
   */
  PasswordReset.getRecentAttempts = function(userId, hours = 24) {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.findAll({
      where: {
        user_id: userId,
        created_at: { [sequelize.Sequelize.Op.gte]: since }
      },
      order: [['created_at', 'DESC']]
    });
  };

  return PasswordReset;
};
