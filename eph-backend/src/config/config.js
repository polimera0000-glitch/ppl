// config/config.js
require('dotenv').config();

const common = {
  dialect: 'postgres',
};

module.exports = {
  development: {
    ...common,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'eph_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  },

  test: {
    ...common,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'eph_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    logging: false,
  },

  production: {
    ...common,
    use_env_variable: 'DATABASE_URL',
    // Most cloud Postgres require SSL. If your provider embeds ?sslmode=require,
    // this is still safe. If your provider supplies a CA, you can replace
    // rejectUnauthorized: true and add ca: process.env.PGSSLROOTCERT contents.
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  },
};