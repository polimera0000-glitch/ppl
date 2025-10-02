// seeders/03-test-student-user.js
'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const studentId = uuidv4();
    const hashedPassword = await bcrypt.hash('student123', 12);

    await queryInterface.bulkInsert('users', [{
      id: studentId,
      name: 'John Doe',
      email: 'student@test.com',
      password_hash: hashedPassword,
      role: 'student',
      college: 'Test University',
      branch: 'Computer Science',
      year: 3,
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      profile_pic_url: null,
      xp: 250,
      badges: ['ROOKIE'],
      verified: true,
      last_login: new Date(),
      oauth_provider: null,
      oauth_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    console.log(`Test student user created with ID: ${studentId}`);
    console.log('Login credentials: student@test.com / student123');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'student@test.com'
    }, {});
  }
};