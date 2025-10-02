'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure a UUID generator exists (pick pgcrypto for gen_random_uuid)
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Make sure id is UUID with a DB-side default
    await queryInterface.sequelize.query(`
      ALTER TABLE "registration_members"
      ALTER COLUMN "id" TYPE uuid USING "id"::uuid,
      ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    `);

    // If your table requires NOT NULL created_at/updated_at, keep defaults too
    await queryInterface.sequelize.query(`
      ALTER TABLE "registration_members"
      ALTER COLUMN "created_at" SET DEFAULT NOW(),
      ALTER COLUMN "updated_at" SET DEFAULT NOW();
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop defaults (leave type as uuid)
    await queryInterface.sequelize.query(`
      ALTER TABLE "registration_members"
      ALTER COLUMN "id" DROP DEFAULT,
      ALTER COLUMN "created_at" DROP DEFAULT,
      ALTER COLUMN "updated_at" DROP DEFAULT;
    `);
  }
};
