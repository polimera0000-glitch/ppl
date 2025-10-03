// src/config/index.js
require('dotenv').config();

/* ----------------------- Helpers ----------------------- */
const env = (k, d = undefined) => (process.env[k] ?? d);
const envInt = (k, d) => {
  const v = process.env[k];
  if (v === undefined || v === null || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const envBool = (k, d = false) => {
  const v = (process.env[k] || '').toLowerCase().trim();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return d;
};
const envList = (k, d = []) => {
  const v = process.env[k];
  if (!v) return d;
  return v.split(',').map(s => s.trim()).filter(Boolean);
};

/* -------------------- DB mode detection -------------------- */
const usingSingleUrl = !!env('DATABASE_URL');
if (process.env.NODE_ENV !== 'test') {
  console.log(usingSingleUrl
    ? 'DB config: using DATABASE_URL'
    : 'DB config: using discrete DB_* variables');
}

/* ----------------------- Config ----------------------- */
const config = {
  server: {
    env: env('NODE_ENV', 'development'),
    port: envInt('PORT', 3000),
    apiVersion: env('API_VERSION', 'v1'),
  },

  database: usingSingleUrl
    ? {
        // Single connection string mode (recommended for prod)
        url: env('DATABASE_URL'),
        ssl: true, // assume SSL in hosted PG; runtime will set dialectOptions accordingly
      }
    : {
        // Discrete variables mode (useful locally)
        host: env('DB_HOST', '127.0.0.1'),
        port: envInt('DB_PORT', 5432),
        name: env('DB_NAME', 'eph_dev'),
        username: env('DB_USERNAME', 'postgres'),
        password: env('DB_PASSWORD', 'password'),
        ssl: envBool('DB_SSL', false),
      },

  jwt: {
    secret: env('JWT_SECRET'),
    expiresIn: env('JWT_EXPIRES_IN', '7d'),
    refreshSecret: env('JWT_REFRESH_SECRET', 'change-refresh'),
    refreshExpiresIn: env('JWT_REFRESH_EXPIRES_IN', '30d'),
    issuer: env('JWT_ISSUER', 'eph-backend'),
  },

  auth: {
    passwordResetExpirySeconds: envInt('PASSWORD_RESET_EXPIRY_SECONDS', 3600),
    adminMagicLinkExpirySeconds: envInt('ADMIN_MAGIC_LINK_EXPIRY_SECONDS', 600),
    // initial admin bootstrap flags
    createInitialAdmin: envBool('CREATE_INITIAL_ADMIN', false),
    initialAdminEmail: env('INITIAL_ADMIN_EMAIL'),
    initialAdminName: env('INITIAL_ADMIN_NAME'),
    initialAdminPassword: env('INITIAL_ADMIN_PASSWORD'),
  },

  app: {
    deepLinkScheme: env('DEEP_LINK_SCHEME', 'eph'),
    webFallbackUrl: env('WEB_FALLBACK_URL', null),
    frontendBaseUrl: env('FRONTEND_BASE_URL') || env('FRONTEND_URL') || null,
  },

  upload: {
    maxFileSize: env('MAX_FILE_SIZE', '50MB'),
    uploadPath: env('UPLOAD_PATH', 'uploads/'),
    videoMaxDuration: envInt('VIDEO_MAX_DURATION', 60),
    allowedVideoFormats: envList('ALLOWED_VIDEO_FORMATS', ['mp4', 'mov', 'avi', 'mkv', 'webm']),
  },

  storage: {
    buckets: {
      videos: env('STORAGE_BUCKET_VIDEOS', 'videos'),
      thumbnails: env('STORAGE_BUCKET_THUMBNAILS', 'thumbnails'),
    },
    publicUrl: env('STORAGE_PUBLIC_URL', null),
  },

  email: {
    smtpHost: env('EMAIL_SMTP_HOST'),
    smtpPort: envInt('EMAIL_SMTP_PORT', 587),
    smtpSecure: envBool('EMAIL_SMTP_SECURE', false), // true for 465, false for 587/STARTTLS
    user: env('EMAIL_USER'),
    password: env('EMAIL_PASSWORD'),
    from: env('EMAIL_FROM'),
    // allow disabling TLS verification for dev/self-signed SMTP
    tlsRejectUnauthorized: envBool('EMAIL_TLS_REJECT_UNAUTHORIZED', true),
  },

  security: {
    bcryptRounds: envInt('BCRYPT_ROUNDS', 12),
    corsOrigin: envList('CORS_ORIGIN', ['http://localhost:3000']),
  },

  rateLimit: {
    window: envInt('RATE_LIMIT_WINDOW', 15), // minutes
    maxRequests: envInt('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  logging: {
    level: env('LOG_LEVEL', 'info'),
    fileEnabled: envBool('LOG_FILE_ENABLED', false),
  },

  video: {
    ffmpegPath: env('FFMPEG_PATH'),
    thumbnail: {
      width: envInt('THUMBNAIL_WIDTH', 640),
      height: envInt('THUMBNAIL_HEIGHT', 360),
    },
  },

  redis: {
    url: env('REDIS_URL', 'redis://localhost:6379'),
    queueUrl: env('QUEUE_REDIS_URL', env('REDIS_URL', 'redis://localhost:6379')),
  },
};

/* --------------- Conditional required envs --------------- */
const requiredEnvVars = [
  'JWT_SECRET',
  // Only require discrete DB vars if not using DATABASE_URL
  ...(usingSingleUrl ? [] : ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME']),
];

// Note: don’t enforce EMAIL_* here — let the app start even if email is disabled
const missing = requiredEnvVars.filter((k) => !process.env[k]);

if (missing.length > 0 && config.server.env !== 'test') {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

module.exports = config;