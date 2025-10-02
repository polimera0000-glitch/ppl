'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_videos_visibility_roles') THEN
       -- enum does not exist (unlikely) - skip
       RAISE NOTICE 'enum_videos_visibility_roles does not exist';
     ELSE
       -- add value if not present
       BEGIN
         ALTER TYPE "enum_videos_visibility_roles" ADD VALUE 'student';
       EXCEPTION WHEN duplicate_object THEN
         -- value already exists, ignore
       END;
     END IF;
   END;
   $$;`
);

  },

  down: async (queryInterface, Sequelize) => {
    // no-op / safe fallback: do not try to change back
    return Promise.resolve();
  }
};
