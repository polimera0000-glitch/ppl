// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

/**
 * Create a Sequelize instance for current environment.
 * - Production: uses DATABASE_URL with SSL (Render Postgres)
 * - Development: uses local DB environment variables
 */
function createSequelizeInstance() {
  const env = process.env.NODE_ENV || 'development';

  // Production / Render
  if (env === 'production' && process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false, // turn on for debugging: console.log
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
      }
    });
  }

  // Development / Local
  return new Sequelize(
    process.env.DB_NAME || 'carebridge_dev',
    process.env.DB_USERNAME || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      dialect: 'postgres',
      logging: env === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true // Soft deletes
      }
    }
  );
}

// Create singleton instance
const sequelize = createSequelizeInstance();

module.exports = sequelize;