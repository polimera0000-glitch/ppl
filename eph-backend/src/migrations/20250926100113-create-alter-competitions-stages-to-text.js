// migrations/20250926XXXXXX-alter-competitions-stages-to-text.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Convert TEXT[] -> TEXT, preserving existing array data as JSON string
    // array_to_json(stages)::text will turn {a,b} into '["a","b"]'
    await queryInterface.sequelize.query(`
      ALTER TABLE competitions
      ALTER COLUMN stages TYPE TEXT
      USING array_to_json(stages)::text
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Best-effort revert: turn TEXT back into TEXT[].
    // Parses JSON array of strings; if parsing fails, set empty array.
    await queryInterface.sequelize.query(`
      ALTER TABLE competitions
      ALTER COLUMN stages TYPE TEXT[]
      USING COALESCE(
        (SELECT ARRAY(
          SELECT jsonb_array_elements_text(stages::jsonb)
        )),
        ARRAY[]::text[]
      )
    `);
  }
};
