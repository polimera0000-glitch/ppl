// migrations/20251007-add-profile-fields-to-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'gender', {
      type: Sequelize.ENUM('male','female','non_binary','prefer_not_to_say'),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'edu_type', {
      type: Sequelize.ENUM('undergraduate','graduate','other'),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'work_experience_years', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'agreed_tnc_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'agreed_privacy_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('users', ['gender']);
    await queryInterface.addIndex('users', ['edu_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', ['edu_type']);
    await queryInterface.removeIndex('users', ['gender']);

    await queryInterface.removeColumn('users', 'agreed_privacy_at');
    await queryInterface.removeColumn('users', 'agreed_tnc_at');
    await queryInterface.removeColumn('users', 'work_experience_years');
    await queryInterface.removeColumn('users', 'edu_type');
    await queryInterface.removeColumn('users', 'gender');

    // Drop enums (Postgres only)
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_gender";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_edu_type";');
    }
  }
};
