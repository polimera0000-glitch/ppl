// src/routes/videos.js
const express = require('express');
const path = require('path');
const multer = require('multer');

const videoController = require('../controllers/videoController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
// const { videoValidation } = require('../middleware/validation');
// const { uploadVideo, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Multer temp storage: put uploads under project uploads/temp
const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp');
const upload = multer({
  dest: tempUploadDir,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit; adjust as needed
  },
});

// Public routes (feed, details) - optionalAuth used when you want personalization for logged-in users
router.get('/feed', optionalAuth, videoController.getVideoFeed);
router.get('/:id', optionalAuth, videoController.getVideoById);

// All routes below require authentication
// (note: authenticate is used inside route handlers too in your original file — keep both if needed)
router.use(authenticate);

// Upload submission endpoint
// Accepts:
//  - 'video' (single file, required for submission)
//  - 'attachments' (optional array of files, e.g. zip, docs)
//  - 'zip' (optional single zip field)
// Field names must match what the frontend sends.
router.post(
  '/',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'attachments', maxCount: 6 },
    { name: 'zip', maxCount: 1 }
  ]),
  videoController.uploadSubmission
);

// If you still need the older uploadVideo handler for admin-style uploads,
// expose it on a separate path (uncomment & wire your middleware/validation as required).
// Example:
// router.post('/upload', uploadVideo, handleUploadError, videoValidation.upload, videoController.uploadVideo);

// Video management routes
router.put('/:id', videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

// Video interactions
router.post('/:id/like', videoController.toggleVideoLike);

// User-specific videos and analytics
router.get('/user/:userId', videoController.getUserVideos);
router.get('/:id/analytics', videoController.getVideoAnalytics);

// Admin-only endpoints
router.put('/:id/feature', requireAdmin, videoController.toggleVideoFeature);
router.get('/admin/stats', requireAdmin, videoController.getVideoStats);

module.exports = router;
