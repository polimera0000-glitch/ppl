// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config'); // your config module

// Defensive config values (won't crash if config or nested fields are missing)
const storageConfig = (config && config.storage && config.storage.local) ? config.storage.local : {};
const UPLOAD_BASE = storageConfig.uploadPath || path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE = typeof storageConfig.maxFileSize === 'number'
  ? storageConfig.maxFileSize
  : 50 * 1024 * 1024; // 50MB default

// Ensure the base upload dir and temp dir exist
const TEMP_DIR = path.join(UPLOAD_BASE, 'temp');
try {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
} catch (err) {
  // If mkdir fails for permission reasons, log and continue; multer will fail later on write.
  console.error('Failed to create upload temp directory', TEMP_DIR, err);
}

// Multer disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `temp_${uniqueSuffix}${ext}`);
  }
});

// File filters
const videoFileFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type. Only MP4, MPEG, MOV, and WebM are allowed.'), false);
};

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
};

// Middlewares
const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('video');

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB images
    files: 1
  }
}).single('image');

const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
}).array('files', 5);

// Human readable size for error message
const humanSize = (n) => {
  if (!n) return '0 B';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  let size = n;
  while (size >= 1024 && i < units.length-1) {
    size /= 1024;
    i++;
  }
  return `${Math.round(size * 10) / 10} ${units[i]}`;
};

// Multer error handler
const handleUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        maxSize: humanSize(MAX_FILE_SIZE)
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  // custom Invalid file type errors from the filters
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Fallback: pass to next error handler
  next(err);
};

module.exports = {
  uploadVideo,
  uploadImage,
  uploadMultiple,
  handleUploadError,
  // export these for tests or other modules if you want
  _internal: {
    UPLOAD_BASE,
    TEMP_DIR,
    MAX_FILE_SIZE
  }
};
