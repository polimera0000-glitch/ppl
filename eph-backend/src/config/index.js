require('dotenv').config();

const ENV = process.env.NODE_ENV || 'development';
const IS_PROD = ENV === 'production';

const config = {
  server: {
    port: process.env.PORT || 3000,
    env: ENV,
    apiVersion: process.env.API_VERSION || 'v1'
  },

  database: {
    url: IS_PROD ? process.env.DATABASE_URL : undefined,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: IS_PROD || process.env.DB_SSL === 'true'
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'eph-backend'
  },

  auth: {
    passwordResetExpirySeconds: Number(process.env.PASSWORD_RESET_EXPIRY) || 3600,
    adminMagicLinkExpirySeconds: Number(process.env.ADMIN_MAGIC_LINK_EXPIRY) || 600
  },

  email: {
    smtpHost: process.env.EMAIL_SMTP_HOST,
    smtpPort: process.env.EMAIL_SMTP_PORT,
    smtpSecure: process.env.EMAIL_SMTP_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM
  }
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

if (!IS_PROD) {
  requiredEnvVars.push('DB_HOST', 'DB_PASSWORD');
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && ENV !== 'test') {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

module.exports = config;
