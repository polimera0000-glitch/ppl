// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const defaultPool = { max: 5, min: 0, acquire: 30000, idle: 10000 };

const baseDefine = {
  timestamps: true,
  underscored: true,
  paranoid: true, // soft deletes
};

const sequelizeConfig = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'carebridge_dev', // <-- ensure this matches your dev DB name
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: defaultPool,
    define: baseDefine,
  },
  test: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'carebridge_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: false,
    pool: defaultPool,
    define: baseDefine,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
    define: baseDefine,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
      // Optional hardening; safe on most hosts:
      keepAlive: true,
    },
    timezone: '+05:30', // Asia/Kolkata; remove if you prefer UTC
  },
};

// Filter chatty SQL when not explicitly logging
function filteringLogger(msg) {
  try {
    if (typeof msg === 'string' && msg.startsWith('Executing (default):')) return;
    console.log(msg);
  } catch (_) {}
}

function createSequelizeInstance() {
  const env = process.env.NODE_ENV || 'development';
  const seqLoggingEnabled = process.env.SEQ_LOGGING === 'true';

  if (env === 'production' && process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: sequelizeConfig.production.dialectOptions,
      pool: sequelizeConfig.production.pool,
      retry: {
        max: 3,
        match: [/ETIMEDOUT/, /ECONNRESET/, /SequelizeConnectionError/],
      },
      timezone: sequelizeConfig.production.timezone,
      define: sequelizeConfig.production.define,
    });
  }

  const cfg = sequelizeConfig[env] || sequelizeConfig.development;

  return new Sequelize(cfg.database, cfg.username, cfg.password, {
    host: cfg.host,
    port: cfg.port,
    dialect: cfg.dialect,
    logging: env === 'development' ? (seqLoggingEnabled ? console.log : filteringLogger) : cfg.logging,
    pool: cfg.pool,
    define: cfg.define,
    retry: { max: env === 'test' ? 0 : 2 },
    timezone: cfg.timezone,
  });
}

const sequelize = createSequelizeInstance();

module.exports = sequelizeConfig;
module.exports.sequelize = sequelize;