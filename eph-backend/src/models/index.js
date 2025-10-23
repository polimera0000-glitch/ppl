// src/models/index.js
'use strict';

// Reuse the already-configured Sequelize instance
// NOTE: this file expects src/config/database.js to export { sequelize } at least.
const dbCfg = require('../config/database');           // <- your singleton module
const { DataTypes } = require('sequelize');

const sequelize = dbCfg.sequelize;
if (!sequelize) {
  throw new Error(
    'Sequelize instance not found. Ensure src/config/database.js exports { sequelize }.'
  );
}

// ---- Model definers ----
const UserDef = require('./User');
const CompetitionDef = require('./Competition');
const RegistrationDef = require('./Registration');
const VideoDef = require('./Video');
const PerkDef = require('./Perk');
const PasswordResetDef = require('./PasswordReset');
const UserPerkDef = require('./UserPerk.js');
const EmailVerificationTokenDef = require('./EmailVerificationToken.js');

// NEW
const SubmissionDef = require('./Submission');
const JudgingCriteriaDef = require('./JudgingCriteria');
const ScoreDef = require('./Score');
const ContactDef = require('./ContactRequest.js');
const TeamInvitationDef = require('./TeamInvitation.js');

// ---- Initialize models (no new Sequelize here) ----
const User = UserDef(sequelize, DataTypes);
const Competition = CompetitionDef(sequelize, DataTypes);
const Registration = RegistrationDef(sequelize, DataTypes);
const Video = VideoDef(sequelize, DataTypes);
const Perk = PerkDef(sequelize, DataTypes);
const PasswordReset = PasswordResetDef(sequelize, DataTypes);
const UserPerk = UserPerkDef(sequelize, DataTypes);
const ContactRequest = ContactDef(sequelize, DataTypes);
const EmailVerificationToken = EmailVerificationTokenDef(sequelize, DataTypes);

// NEW
const Submission = SubmissionDef(sequelize, DataTypes);
const JudgingCriteria = JudgingCriteriaDef(sequelize, DataTypes);
const Score = ScoreDef(sequelize, DataTypes);
const TeamInvitation = TeamInvitationDef(sequelize, DataTypes);

// ---- Associations ----

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
Registration.hasMany(TeamInvitation, { foreignKey: 'registration_id', as: 'invitations' });

// Video
Video.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

// PasswordReset
PasswordReset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

EmailVerificationToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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

ContactRequest.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
ContactRequest.belongsTo(User, { as: 'recipient', foreignKey: 'recipient_id' });
if (Submission) {
  ContactRequest.belongsTo(Submission, { as: 'submission', foreignKey: 'submission_id' });
}

// TeamInvitation associations
TeamInvitation.belongsTo(Registration, { foreignKey: 'registration_id', as: 'registration' });
TeamInvitation.belongsTo(User, { foreignKey: 'inviter_id', as: 'inviter' });
TeamInvitation.belongsTo(User, { foreignKey: 'invitee_id', as: 'invitee' });
User.hasMany(TeamInvitation, { foreignKey: 'inviter_id', as: 'sentInvitations' });
User.hasMany(TeamInvitation, { foreignKey: 'invitee_id', as: 'receivedInvitations' });

// ---- Export ----
module.exports = {
  sequelize,
  // expose models
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
  ContactRequest,
  EmailVerificationToken,
  TeamInvitation,
};