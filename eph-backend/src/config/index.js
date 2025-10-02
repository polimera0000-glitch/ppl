require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1'
  },
  
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true'
  },

  // Supabase config removed (not needed for PostgreSQL-only setup)
  /*
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  */

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
  app: {
    deepLinkScheme: process.env.DEEP_LINK_SCHEME || 'eph',
    webFallbackUrl: process.env.WEB_FALLBACK_URL || null
  },

  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    videoMaxDuration: parseInt(process.env.VIDEO_MAX_DURATION) || 60,
    allowedVideoFormats: process.env.ALLOWED_VIDEO_FORMATS?.split(',') || ['mp4', 'mov', 'avi', 'mkv', 'webm']
  },

  storage: {
    buckets: {
      videos: process.env.STORAGE_BUCKET_VIDEOS || 'videos',
      thumbnails: process.env.STORAGE_BUCKET_THUMBNAILS || 'thumbnails'
    },
    publicUrl: process.env.STORAGE_PUBLIC_URL
  },

  email: {
  smtpHost: process.env.EMAIL_SMTP_HOST,
  smtpPort: process.env.EMAIL_SMTP_PORT,
  smtpSecure: process.env.EMAIL_SMTP_SECURE === 'true',
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM
},

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
  },

  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileEnabled: process.env.LOG_FILE_ENABLED === 'true'
  },

  video: {
    ffmpegPath: process.env.FFMPEG_PATH,
    thumbnail: {
      width: parseInt(process.env.THUMBNAIL_WIDTH) || 640,
      height: parseInt(process.env.THUMBNAIL_HEIGHT) || 360
    }
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    queueUrl: process.env.QUEUE_REDIS_URL || 'redis://localhost:6379'
  }
};

// Validate required environment variables (Supabase removed)
const requiredEnvVars = [
  'DB_HOST',
  'DB_PASSWORD',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

module.exports = config;
