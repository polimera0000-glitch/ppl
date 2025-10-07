'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('contact_requests', {
      id: {
        type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4,
        primaryKey: true, allowNull: false,
      },

      // who is contacting (hiring/investor/admin)
      sender_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      sender_role: {
        type: Sequelize.ENUM('hiring', 'investor', 'admin'),
        allowNull: false,
      },

      // who is being contacted (typically the student author)
      recipient_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },

      // optional – tie to a specific project/submission
      submission_id: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'submissions', key: 'id' },
        onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },

      subject: { type: Sequelize.STRING(200), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },

      // snapshot some sender details (so messages stay meaningful if sender later edits profile)
      sender_company_name: { type: Sequelize.STRING(255), allowNull: true },
      sender_firm_name: { type: Sequelize.STRING(255), allowNull: true },

      // recipient can reply to these contacts
      contact_email: { type: Sequelize.STRING(255), allowNull: true },
      contact_phone: { type: Sequelize.STRING(50), allowNull: true },

      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'closed'),
        allowNull: false, defaultValue: 'pending',
      },

      seen_at: { type: Sequelize.DATE, allowNull: true },
      replied_at: { type: Sequelize.DATE, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('contact_requests', ['recipient_id', 'status']);
    await queryInterface.addIndex('contact_requests', ['sender_id']);
    await queryInterface.addIndex('contact_requests', ['submission_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('contact_requests');

    // Drop ENUMs created in this migration (optional cleanup)
    try { await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_contact_requests_status";`); } catch {}
    try { await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_contact_requests_sender_role";`); } catch {}
  },
};

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
