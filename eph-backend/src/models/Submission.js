module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    competition_id: { type: DataTypes.UUID, allowNull: false },
    leader_id: { type: DataTypes.UUID, allowNull: false },
    team_name: DataTypes.STRING,
    title: { type: DataTypes.STRING, allowNull: false },
    summary: DataTypes.TEXT,
    repo_url: DataTypes.TEXT,
    drive_url: DataTypes.TEXT,
    video_url: DataTypes.TEXT,
    zip_url: DataTypes.TEXT,
    attachments_json: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('submitted','under_review','needs_changes','disqualified','shortlisted','winner','not_winner','published'),
      allowNull: false, defaultValue: 'submitted'
    },
    final_score: DataTypes.FLOAT,
    feedback: DataTypes.TEXT
  }, {
    tableName: 'submissions',
    underscored: true
  });

  Submission.associate = (models) => {
    Submission.belongsTo(models.Competition, { as: 'competition', foreignKey: 'competition_id' });
    Submission.belongsTo(models.User, { as: 'leader', foreignKey: 'leader_id' });
    Submission.hasMany(models.Score, { as: 'scores', foreignKey: 'submission_id' });
  };

  return Submission;
};
