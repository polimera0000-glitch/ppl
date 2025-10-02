// User roles
const USER_ROLES = {
  STUDENT: 'student',
  HIRING: 'hiring',
  INVESTOR: 'investor',
  ADMIN: 'admin'
};

// Video statuses
const VIDEO_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Competition statuses
const COMPETITION_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Registration statuses
const REGISTRATION_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  WAITLISTED: 'waitlisted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

// Registration types
const REGISTRATION_TYPES = {
  INDIVIDUAL: 'individual',
  TEAM: 'team'
};


// Perk types
const PERK_TYPES = {
  DISCOUNT: 'discount',
  FREEBIE: 'freebie',
  ACCESS: 'access',
  COURSE: 'course',
  MENTORSHIP: 'mentorship',
  CERTIFICATION: 'certification'
};

// Video visibility roles
const VIDEO_VISIBILITY_ROLES = {
  UPLOADER: 'uploader',
  HIRING: 'hiring',
  INVESTOR: 'investor',
  ADMIN: 'admin'
};

// File upload constraints
const FILE_CONSTRAINTS = {
  VIDEO: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_DURATION: 60, // 60 seconds
    ALLOWED_FORMATS: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    MIME_TYPES: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm'
    ]
  },
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
    MIME_TYPES: [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  }
};

// XP rewards
const XP_REWARDS = {
  VIDEO_UPLOAD: 25,
  COMPETITION_REGISTER: 10,
  COMPETITION_COMPLETE: 50,
  COMPETITION_WIN_1ST: 200,
  COMPETITION_WIN_2ND: 150,
  COMPETITION_WIN_3RD: 100,
  DAILY_LOGIN: 5,
  PROFILE_COMPLETE: 20,
  EMAIL_VERIFY: 15
};

// Badge types
const BADGE_TYPES = {
  ROOKIE: 'ROOKIE', // 100 XP
  EXPLORER: 'EXPLORER', // 500 XP
  ACHIEVER: 'ACHIEVER', // 1000 XP
  MASTER: 'MASTER', // 2500 XP
  LEGEND: 'LEGEND', // 5000 XP
  CHAMPION: 'CHAMPION', // Competition winner
  INNOVATOR: 'INNOVATOR', // Multiple video uploads
  COLLABORATOR: 'COLLABORATOR', // Team participation
  MENTOR: 'MENTOR' // Helping others
};

// Error codes
const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_SUPPORTED: 'FILE_TYPE_NOT_SUPPORTED',
  VIDEO_TOO_LONG: 'VIDEO_TOO_LONG',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Competition errors
  COMPETITION_CLOSED: 'COMPETITION_CLOSED',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  TEAM_SIZE_EXCEEDED: 'TEAM_SIZE_EXCEEDED',
  NO_SEATS_AVAILABLE: 'NO_SEATS_AVAILABLE',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Cache durations (in seconds)
const CACHE_DURATION = {
  SHORT: 5 * 60,        // 5 minutes
  MEDIUM: 30 * 60,      // 30 minutes
  LONG: 2 * 60 * 60,    // 2 hours
  VERY_LONG: 24 * 60 * 60 // 24 hours
};

// Notification types
const NOTIFICATION_TYPES = {
  COMPETITION_REGISTERED: 'competition_registered',
  COMPETITION_CONFIRMED: 'competition_confirmed',
  COMPETITION_REMINDER: 'competition_reminder',
  VIDEO_PROCESSED: 'video_processed',
  BADGE_EARNED: 'badge_earned',
  PERK_AVAILABLE: 'perk_available'
};

module.exports = {
  USER_ROLES,
  VIDEO_STATUSES,
  COMPETITION_STATUSES,
  REGISTRATION_STATUSES,
  REGISTRATION_TYPES,
  PERK_TYPES,
  VIDEO_VISIBILITY_ROLES,
  FILE_CONSTRAINTS,
  XP_REWARDS,
  BADGE_TYPES,
  ERROR_CODES,
  HTTP_STATUS,
  PAGINATION,
  CACHE_DURATION,
  NOTIFICATION_TYPES
};