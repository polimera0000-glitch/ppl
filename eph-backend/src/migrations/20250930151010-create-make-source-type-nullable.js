module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('competitions', 'source_type');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('competitions', 'source_type', {
      type: Sequelize.STRING(50),
      allowNull: false, // or true if you prefer
      defaultValue: 'general',
    });
  }
};
