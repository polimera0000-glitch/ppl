'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('payments', 'coupon_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'coupons',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Applied coupon for this payment'
    });

    await queryInterface.addColumn('payments', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Discount amount applied from coupon'
    });

    await queryInterface.addColumn('payments', 'original_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Original amount before discount'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('payments', 'coupon_id');
    await queryInterface.removeColumn('payments', 'discount_amount');
    await queryInterface.removeColumn('payments', 'original_amount');
  }
};
