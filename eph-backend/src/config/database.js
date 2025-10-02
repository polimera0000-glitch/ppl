// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const defaultPool = {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000
};

const baseDefine = {
  timestamps: true,
  underscored: true,
  paranoid: true // Soft deletes
};

const sequelizeConfig = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'carebridge_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    // NOTE: logging is configured dynamically when creating Sequelize instance
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: defaultPool,
    define: baseDefine
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
    define: baseDefine
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    define: baseDefine,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

/**
 * Helper logger used when SEQ_LOGGING is not enabled.
 * It filters out common sequelize/pg introspection noise that starts with:
 *   "Executing (default):"
 * and lets other SQL / messages pass through to console.log.
 */
function filteringLogger(msg) {
  try {
    if (typeof msg === 'string') {
      // Ignore the sync / schema-alter / introspection noise
      if (msg.startsWith('Executing (default):')) {
        return;
      }
      // Optional extra filters:
      // if (msg.includes('information_schema') || msg.includes('pg_catalog')) return;
    }
    // Fallback: log anything else
    console.log(msg);
  } catch (e) {
    // never throw from logger
  }
}

/**
 * Create sequelize instance for the current environment.
 * - In production prefer DATABASE_URL (e.g. provided by Heroku / cloud DB services)
 * - Otherwise use username/password/host/port/dbname from env
 *
 * Controls:
 * - SEQ_LOGGING=true  -> enable full SQL logging (console.log)
 * - otherwise use filteringLogger to remove sync/introspection noise
 */
function createSequelizeInstance() {
  const env = process.env.NODE_ENV || 'development';

  // allow explicit override for logging verbosity
  const seqLoggingEnabled = process.env.SEQ_LOGGING === 'true';

  if (env === 'production' && process.env.DATABASE_URL) {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: sequelizeConfig.production.dialectOptions,
      pool: sequelizeConfig.production.pool
    });
  }

  const cfg = sequelizeConfig[env] || sequelizeConfig.development;

  // decide logging function/value to pass to Sequelize
  let loggingOption;
  if (env === 'development') {
    loggingOption = seqLoggingEnabled ? console.log : filteringLogger;
  } else {
    // test or other envs - use configured setting
    loggingOption = cfg.logging;
  }

  return new Sequelize(
    cfg.database,
    cfg.username,
    cfg.password,
    {
      host: cfg.host,
      port: cfg.port,
      dialect: cfg.dialect,
      logging: loggingOption,
      pool: cfg.pool,
      define: cfg.define
    }
  );
}

// Create instance (singleton)
const sequelize = createSequelizeInstance();

module.exports = sequelizeConfig;
module.exports.sequelize = sequelize;
