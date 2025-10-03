// src/config/database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

/* -------------------- Helpers -------------------- */
function normalizeDatabaseUrl(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  const trimmed = raw.trim();

  try {
    const u = new URL(trimmed);

    // Normalize scheme: allow "postgresql://" but prefer "postgres://"
    if (u.protocol === 'postgresql:') {
      u.protocol = 'postgres:';
    }

    return u.toString();
  } catch {
    // If URL parsing fails, return the original (Sequelize may still handle it)
    return trimmed;
  }
}

function ensureSslmodeRequire(raw) {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    // If sslmode absent, add sslmode=require (safe on most providers)
    if (!u.searchParams.has('sslmode')) {
      u.searchParams.set('sslmode', 'require');
    }
    return u.toString();
  } catch {
    return raw;
  }
}

/* -------------------- Defaults -------------------- */
const defaultPool = { max: 5, min: 0, acquire: 30000, idle: 10000 };

const baseDefine = {
  timestamps: true,   // created_at / updated_at
  underscored: true,  // snake_case columns
  paranoid: true,      // deleted_at (soft deletes)
  freezeTableName: true,
};

/* -------------------- Environment Config -------------------- */
const config = {
  development: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'eph_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: process.env.SEQ_LOGGING === 'true' ? console.log : false,
    pool: defaultPool,
    define: baseDefine,
    timezone: '+05:30', // Asia/Kolkata; remove if you prefer UTC/DB default
  },

  test: {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'eph_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dialect: 'postgres',
    logging: false,
    pool: defaultPool,
    define: baseDefine,
    timezone: '+05:30',
  },

  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
    define: baseDefine,
    timezone: '+05:30',
    dialectOptions: {
      ssl: {
        require: true,
        // If you provide a CA via PGSSLROOTCERT, we can fully verify:
        rejectUnauthorized: !!process.env.PGSSLROOTCERT,
        ca: process.env.PGSSLROOTCERT || undefined,
      },
      keepAlive: true,
    },
  },
};

/* -------------------- Dev SQL noise filter -------------------- */
function filteringLogger(msg) {
  try {
    if (typeof msg === 'string' && msg.startsWith('Executing (default):')) return;
    console.log(msg);
  } catch (_) {}
}

/* -------------------- Factory -------------------- */
function createSequelizeInstance() {
  const env = process.env.NODE_ENV || 'development';

  // Production via DATABASE_URL
  if (env === 'production' && process.env.DATABASE_URL) {
    // Normalize & harden the URL
    const normalized = normalizeDatabaseUrl(process.env.DATABASE_URL);
    const hardened = ensureSslmodeRequire(normalized);

    return new Sequelize(hardened, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: config.production.logging,
      pool: config.production.pool,
      define: config.production.define,
      timezone: config.production.timezone,
      dialectOptions: config.production.dialectOptions,
      retry: {
        max: 3,
        match: [
          /ETIMEDOUT/,
          /ECONNRESET/,
          /SequelizeConnection(?:Refused|Error|TimedOut)/,
          /Connection terminated unexpectedly/,
        ],
      },
    });
  }

  // Dev / Test from discrete params
  const cfg = config[env] || config.development;
  return new Sequelize(cfg.database, cfg.username, cfg.password, {
    host: cfg.host,
    port: cfg.port,
    dialect: cfg.dialect,
    logging:
      env === 'development'
        ? (process.env.SEQ_LOGGING === 'true' ? console.log : filteringLogger)
        : cfg.logging,
    pool: cfg.pool,
    define: cfg.define,
    timezone: cfg.timezone,
    retry: { max: env === 'test' ? 0 : 2 },
  });
}

/* -------------------- Singleton -------------------- */
const sequelize = createSequelizeInstance();

/* -------------------- Exports -------------------- */
module.exports = {
  sequelize,
  Sequelize,
  config,
  createSequelizeInstance,
};