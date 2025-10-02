'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // use a transaction so all operations roll back on failure
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'user_perks',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,
          },

          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },

          perk_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'perks',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },

          redeemed_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },

          redemption_data: {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: {},
          },

          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },

          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
        },
        { transaction: t }
      );

      // Add indexes (including the unique constraint on user_id + perk_id)
      await queryInterface.addIndex('user_perks', ['user_id'], { transaction: t, name: 'user_perks_user_id_idx' });
      await queryInterface.addIndex('user_perks', ['perk_id'], { transaction: t, name: 'user_perks_perk_id_idx' });
      await queryInterface.addIndex(
        'user_perks',
        ['user_id', 'perk_id'],
        { unique: true, transaction: t, name: 'user_perks_user_perk_unique' }
      );
      await queryInterface.addIndex('user_perks', ['redeemed_at'], { transaction: t, name: 'user_perks_redeemed_at_idx' });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // drop table inside a transaction
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('user_perks', { transaction: t });
    });
  },
};
