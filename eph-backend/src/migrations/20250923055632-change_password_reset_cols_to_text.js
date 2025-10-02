'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // convert ip_address and user_agent to text (if they exist)
    // Doing ALTER TYPE only if column exists is DB-specific; this does a safe ALTER TABLE
    await queryInterface.sequelize.transaction(async (t) => {
      // ip_address -> text
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "password_resets" ALTER COLUMN "ip_address" TYPE text USING "ip_address"::text;`,
          { transaction: t }
        );
      } catch (_) { /* ignore if column missing or already text */ }

      // user_agent -> text
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE "password_resets" ALTER COLUMN "user_agent" TYPE text USING "user_agent"::text;`,
          { transaction: t }
        );
      } catch (_) { /* ignore */ }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // no-op / safe fallback: do not try to change back
    return Promise.resolve();
  }
};
