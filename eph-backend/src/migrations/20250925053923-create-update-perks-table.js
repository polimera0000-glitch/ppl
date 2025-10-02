// migrations/YYYYMMDDHHMMSS-update-perks-table.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('perks');
    
    // Add external_url if it doesn't exist (for redemption URLs)
    if (!tableDescription.external_url) {
      await queryInterface.addColumn('perks', 'external_url', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    
    // Add promo_code if it doesn't exist (for redemption codes)
    if (!tableDescription.promo_code) {
      await queryInterface.addColumn('perks', 'promo_code', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    
    // Add redemption_instructions if it doesn't exist
    if (!tableDescription.redemption_instructions) {
      await queryInterface.addColumn('perks', 'redemption_instructions', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    
    // Rename existing columns if they have different names
    // These are optional - only if your current schema uses different names
    
    // If you have 'redemption_url' instead of 'external_url'
    if (tableDescription.redemption_url && !tableDescription.external_url) {
      await queryInterface.renameColumn('perks', 'redemption_url', 'external_url');
    }
    
    // If you have 'redemption_code' instead of 'promo_code'  
    if (tableDescription.redemption_code && !tableDescription.promo_code) {
      await queryInterface.renameColumn('perks', 'redemption_code', 'promo_code');
    }
    
    // If you have 'instructions' instead of 'redemption_instructions'
    if (tableDescription.instructions && !tableDescription.redemption_instructions) {
      await queryInterface.renameColumn('perks', 'instructions', 'redemption_instructions');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns added in this migration
    const tableDescription = await queryInterface.describeTable('perks');
    
    if (tableDescription.external_url) {
      await queryInterface.removeColumn('perks', 'external_url');
    }
    
    if (tableDescription.promo_code) {
      await queryInterface.removeColumn('perks', 'promo_code');
    }
    
    if (tableDescription.redemption_instructions) {
      await queryInterface.removeColumn('perks', 'redemption_instructions');
    }
  }
};