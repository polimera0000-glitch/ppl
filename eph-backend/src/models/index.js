// src/models/index.js
'use strict';

const { Sequelize, sequelize } = require('../config/database');

// --- Import model definers ---
const UserDef = require('./User');
const CompetitionDef = require('./Competition');
const RegistrationDef = require('./Registration');
const VideoDef = require('./Video');
const PerkDef = require('./Perk');
const PasswordResetDef = require('./PasswordReset');
const UserPerkDef = require('./UserPerk.js');

// NEW models
const SubmissionDef = require('./Submission');
const JudgingCriteriaDef = require('./JudgingCriteria');
const ScoreDef = require('./Score');

// --- Initialize models with the shared Sequelize instance ---
const User = UserDef(sequelize, Sequelize.DataTypes);
const Competition = CompetitionDef(sequelize, Sequelize.DataTypes);
const Registration = RegistrationDef(sequelize, Sequelize.DataTypes);
const Video = VideoDef(sequelize, Sequelize.DataTypes);
const Perk = PerkDef(sequelize, Sequelize.DataTypes);
const PasswordReset = PasswordResetDef(sequelize, Sequelize.DataTypes);
const UserPerk = UserPerkDef(sequelize, Sequelize.DataTypes);

// NEW
const Submission = SubmissionDef(sequelize, Sequelize.DataTypes);
const JudgingCriteria = JudgingCriteriaDef(sequelize, Sequelize.DataTypes);
const Score = ScoreDef(sequelize, Sequelize.DataTypes);

// --- Associations ---

// User
User.hasMany(Registration, { foreignKey: 'leader_id', as: 'ledRegistrations' });
User.hasMany(Video, { foreignKey: 'uploader_id', as: 'videos' });
User.hasMany(PasswordReset, { foreignKey: 'user_id', as: 'passwordResets' });

// Competition
Competition.hasMany(Registration, { foreignKey: 'competition_id', as: 'registrations' });
Competition.belongsTo(User, { as: 'createdBy', foreignKey: 'created_by' });
Competition.hasMany(Submission, { as: 'submissions', foreignKey: 'competition_id' });
Competition.hasMany(JudgingCriteria, { as: 'criteria', foreignKey: 'competition_id' });

// Registration
Registration.belongsTo(User, { foreignKey: 'leader_id', as: 'leader' });
Registration.belongsTo(Competition, { foreignKey: 'competition_id', as: 'competition' });

// Video
Video.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

// PasswordReset
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Users ↔ Registrations (team members)
User.belongsToMany(Registration, {
  through: 'registration_members',
  foreignKey: 'user_id',
  otherKey: 'registration_id',
  as: 'memberOfRegistrations',
  timestamps: false,
});
Registration.belongsToMany(User, {
  through: 'registration_members',
  foreignKey: 'registration_id',
  otherKey: 'user_id',
  as: 'teamMembers',
});

// Perks M:M + junction
User.belongsToMany(Perk, {
  through: 'user_perks',
  foreignKey: 'user_id',
  otherKey: 'perk_id',
  as: 'redeemedPerks',
  timestamps: true,
});
Perk.belongsToMany(User, {
  through: 'user_perks',
  foreignKey: 'perk_id',
  otherKey: 'user_id',
  as: 'redeemedBy',
  timestamps: true,
});
User.hasMany(UserPerk, { foreignKey: 'user_id', as: 'userPerks' });
UserPerk.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Perk.hasMany(UserPerk, { foreignKey: 'perk_id', as: 'userRedemptions' });
UserPerk.belongsTo(Perk, { foreignKey: 'perk_id', as: 'perk' });

// Submissions & Judging
Submission.belongsTo(Competition, { as: 'competition', foreignKey: 'competition_id' });
Submission.belongsTo(User, { as: 'leader', foreignKey: 'leader_id' });
Submission.hasMany(Score, { as: 'scores', foreignKey: 'submission_id' });

JudgingCriteria.belongsTo(Competition, { as: 'competition', foreignKey: 'competition_id' });

Score.belongsTo(Submission, { as: 'submission', foreignKey: 'submission_id' });
Score.belongsTo(User, { as: 'judge', foreignKey: 'judge_id' });
Score.belongsTo(JudgingCriteria, { as: 'criterion', foreignKey: 'criterion_id' });

// --- Export a single db object ---
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
  Submission,
  JudgingCriteria,
  Score,
};

module.exports = db;