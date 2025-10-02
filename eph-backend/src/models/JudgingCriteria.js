module.exports = (sequelize, DataTypes) => {
  const JudgingCriteria = sequelize.define('JudgingCriteria', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    competition_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    weight: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
    max_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 10 }
  }, {
    tableName: 'judging_criteria',
    underscored: true
  });

  JudgingCriteria.associate = (models) => {
    JudgingCriteria.belongsTo(models.Competition, { as: 'competition', foreignKey: 'competition_id' });
  };

  return JudgingCriteria;
};
