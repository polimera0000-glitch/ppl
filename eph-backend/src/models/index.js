const { Sequelize } = require('sequelize');
const config = require('../config/database.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Base models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Competition = require('./Competition')(sequelize, Sequelize.DataTypes);
const Registration = require('./Registration')(sequelize, Sequelize.DataTypes);
const Video = require('./Video')(sequelize, Sequelize.DataTypes);
const Perk = require('./Perk')(sequelize, Sequelize.DataTypes);
const PasswordReset = require('./PasswordReset')(sequelize, Sequelize.DataTypes);
const UserPerk = require('./UserPerk.js')(sequelize, Sequelize.DataTypes);

// NEW models
const Submission = require('./Submission')(sequelize, Sequelize.DataTypes);
const JudgingCriteria = require('./JudgingCriteria')(sequelize, Sequelize.DataTypes);
const Score = require('./Score')(sequelize, Sequelize.DataTypes);

const db = {
  sequelize,
  Sequelize,
  User,
  Competition,
  Registration,
  Video,
  Perk,
  PasswordReset,
  UserPerk,
  // new
  Submission,
  JudgingCriteria,
  Score
};

// User
User.hasMany(Registration, { foreignKey: 'leader_id', as: 'ledRegistrations' });
User.hasMany(Video, { foreignKey: 'uploader_id', as: 'videos' });
User.hasMany(PasswordReset, { foreignKey: 'user_id', as: 'passwordResets' });

// Competition
Competition.hasMany(Registration, { foreignKey: 'competition_id', as: 'registrations' });
Competition.belongsTo(User, { as: 'createdBy', foreignKey: 'created_by' });
Competition.hasMany(Submission, { 
      as: 'submissions', 
      foreignKey: 'competition_id' 
    });
Competition.hasMany(JudgingCriteria, { 
      as: 'criteria', 
      foreignKey: 'competition_id' 
    });

// Registration
Registration.belongsTo(User, { foreignKey: 'leader_id', as: 'leader' });
Registration.belongsTo(Competition, { foreignKey: 'competition_id', as: 'competition' });

// Video
Video.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

// PasswordReset
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Many-to-many: Users ↔ Registrations
User.belongsToMany(Registration, {
  through: 'registration_members',
  foreignKey: 'user_id',
  otherKey: 'registration_id',
  as: 'memberOfRegistrations',
  timestamps: false
});
Registration.belongsToMany(User, {
  through: 'registration_members',
  foreignKey: 'registration_id',
  otherKey: 'user_id',
  as: 'teamMembers'
});

// Perks M:M + junction
User.belongsToMany(Perk, {
  through: 'user_perks',
  foreignKey: 'user_id',
  otherKey: 'perk_id',
  as: 'redeemedPerks',
  timestamps: true
});
Perk.belongsToMany(User, {
  through: 'user_perks',
  foreignKey: 'perk_id',
  otherKey: 'user_id',
  as: 'redeemedBy',
  timestamps: true
});
User.hasMany(UserPerk, { foreignKey: 'user_id', as: 'userPerks' });
UserPerk.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Perk.hasMany(UserPerk, { foreignKey: 'perk_id', as: 'userRedemptions' });
UserPerk.belongsTo(Perk, { foreignKey: 'perk_id', as: 'perk' });

// NEW: Submissions & Judging
Submission.belongsTo(Competition, { as: 'competition', foreignKey: 'competition_id' });
Submission.belongsTo(User, { as: 'leader', foreignKey: 'leader_id' });
Submission.hasMany(Score, { as: 'scores', foreignKey: 'submission_id' });

JudgingCriteria.belongsTo(Competition, { as: 'competition', foreignKey: 'competition_id' });

Score.belongsTo(Submission, { as: 'submission', foreignKey: 'submission_id' });
Score.belongsTo(User, { as: 'judge', foreignKey: 'judge_id' });
Score.belongsTo(JudgingCriteria, { as: 'criterion', foreignKey: 'criterion_id' });

module.exports = db;
