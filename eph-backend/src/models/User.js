// models/User.js - Add this field to your existing User model
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      role: {
        type: DataTypes.ENUM("student", "hiring", "investor", "admin"),
        allowNull: false,
        defaultValue: "student",
      },
      college: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      branch: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 6,
        },
      },
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: false,
      },
      profile_pic_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      badges: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: false,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      phone: { type: DataTypes.STRING(32), allowNull: true },
      org: { type: DataTypes.STRING(255), allowNull: true },
      country: { type: DataTypes.STRING(100), allowNull: true },
      last_ip: { type: DataTypes.INET, allowNull: true },
      last_login_device: { type: DataTypes.STRING(255), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      super_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      permissions: { type: DataTypes.JSONB, defaultValue: {}, allowNull: true },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      oauth_provider: {
        type: DataTypes.ENUM("google", "github"),
        allowNull: true,
      },
      oauth_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      // NEW FIELD: Force password change for newly invited admins
      force_password_change: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment:
          "Forces user to change password on next login (used for new admin invites)",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
        {
          fields: ["role"],
        },
        {
          fields: ["college", "branch"],
        },
        {
          fields: ["xp"],
        },
        {
          fields: ["oauth_provider", "oauth_id"],
        },
        {
          fields: ["force_password_change"], // Index for quick lookup of users who need password change
        },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password_hash) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password_hash")) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        },
      },
    }
  );

  // Instance methods
  User.prototype.validatePassword = async function (password) {
    // OAuth users can't validate password
    if (this.password_hash.startsWith("oauth_")) {
      return false;
    }
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.isOAuthUser = function () {
    return this.oauth_provider !== null;
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    // Keep force_password_change in response for frontend to handle
    return values;
  };

  User.prototype.addXP = async function (points, reason = "Activity") {
    this.xp += points;
    await this.save();

    // Check for new badges based on XP
    await this.checkBadges();

    return this;
  };

  User.prototype.checkBadges = async function () {
    const currentBadges = this.badges || [];
    const newBadges = [];

    // XP-based badges
    if (this.xp >= 100 && !currentBadges.includes("ROOKIE")) {
      newBadges.push("ROOKIE");
    }
    if (this.xp >= 500 && !currentBadges.includes("EXPLORER")) {
      newBadges.push("EXPLORER");
    }
    if (this.xp >= 1000 && !currentBadges.includes("ACHIEVER")) {
      newBadges.push("ACHIEVER");
    }
    if (this.xp >= 2500 && !currentBadges.includes("MASTER")) {
      newBadges.push("MASTER");
    }

    if (newBadges.length > 0) {
      this.badges = [...currentBadges, ...newBadges];
      await this.save();
    }

    return newBadges;
  };

  // Class methods
  User.findByEmail = async function (email) {
    return this.findOne({ where: { email } });
  };

  User.findByOAuth = async function (provider, oauthId) {
    return this.findOne({
      where: {
        oauth_provider: provider,
        oauth_id: oauthId,
      },
    });
  };

  User.findActive = function () {
    return this.findAll({ where: { is_active: true } });
  };

  User.getLeaderboard = function (limit = 50) {
    return this.findAll({
      where: { is_active: true },
      order: [["xp", "DESC"]],
      limit,
      attributes: ["id", "name", "college", "xp", "badges", "profile_pic_url"],
    });
  };

  // NEW: Find users who need to change password
  User.findUsersRequiringPasswordChange = function () {
    return this.findAll({
      where: {
        force_password_change: true,
        is_active: true,
      },
      attributes: ["id", "email", "name", "role", "created_at"],
    });
  };

  return User;
};
