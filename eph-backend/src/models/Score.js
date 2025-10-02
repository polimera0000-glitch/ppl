module.exports = (sequelize, DataTypes) => {
  const Score = sequelize.define('Score', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    submission_id: { type: DataTypes.UUID, allowNull: false },
    judge_id: { type: DataTypes.UUID, allowNull: false },
    criterion_id: { type: DataTypes.UUID, allowNull: false },
    score: { type: DataTypes.FLOAT, allowNull: false },
    comment: DataTypes.TEXT
  }, {
    tableName: 'scores',
    underscored: true,
    indexes: [{ unique: true, fields: ['submission_id','judge_id','criterion_id'] }]
  });

  Score.associate = (models) => {
    Score.belongsTo(models.Submission, { as: 'submission', foreignKey: 'submission_id' });
    Score.belongsTo(models.User, { as: 'judge', foreignKey: 'judge_id' });
    Score.belongsTo(models.JudgingCriteria, { as: 'criterion', foreignKey: 'criterion_id' });
  };

  return Score;
};
