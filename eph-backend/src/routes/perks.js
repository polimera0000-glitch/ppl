// const express = require('express');
// const perkController = require('../controllers/perkController');
// const { authenticate, optionalAuth } = require('../middleware/auth');
// const { requireAdmin } = require('../middleware/roleCheck');
// const { perkValidation } = require('../middleware/validation');

// const router = express.Router();

// // Public routes (with optional auth for personalization)
// router.get('/', optionalAuth, perkController.getAllPerks);
// router.get('/featured', optionalAuth, perkController.getFeaturedPerks);
// router.get('/category/:category', optionalAuth, perkController.getPerksByCategory);
// router.get('/:id', optionalAuth, perkController.getPerkById);

// // Protected routes - require authentication
// router.use(authenticate);

// // User perk management
// router.post('/:id/redeem', perkController.redeemPerk);
// router.get('/my/redeemed', perkController.getUserRedeemedPerks);
// router.get('/my/available', perkController.getAvailablePerks);

// // Admin routes - perk management
// router.post('/', requireAdmin, perkValidation.create, perkController.createPerk);
// router.put('/:id', requireAdmin, perkValidation.update, perkController.updatePerk);
// router.delete('/:id', requireAdmin, perkController.deletePerk);
// router.put('/:id/feature', requireAdmin, perkController.togglePerkFeatured);

// // Admin routes - analytics
// router.get('/admin/stats', requireAdmin, perkController.getPerkStats);
// router.get('/:id/redemptions', requireAdmin, perkController.getPerkRedemptions);

// module.exports = router;

// src/routes/perkRoutes.js
const express = require('express');
const perkController = require('../controllers/perkController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const { body, param, query } = require('express-validator');
const { handleValidationErrors: validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation middleware
const perkValidation = {
  create: [
    body('title').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description').notEmpty().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('type').isIn(['discount', 'freebie', 'access', 'course', 'mentorship', 'certification']).withMessage('Invalid perk type'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('xp_required').optional().isInt({ min: 0, max: 100000 }).withMessage('XP required must be 0-100000'),
    body('max_redemptions').optional().isInt({ min: 1 }).withMessage('Max redemptions must be positive integer'),
    body('target_roles').optional().isArray().withMessage('Target roles must be an array'),
    body('valid_from').optional().isISO8601().withMessage('Valid from must be a valid date'),
    body('valid_until').optional().isISO8601().withMessage('Valid until must be a valid date'),
    body('external_url').optional().isURL().withMessage('External URL must be valid'),
    body('image_url').optional().isURL().withMessage('Image URL must be valid'),
    body('promo_code').optional().trim().isLength({ max: 100 }).withMessage('Promo code must be less than 100 characters'),
    validateRequest
  ],
  update: [
    param('id').isUUID().withMessage('Invalid perk ID'),
    body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    body('type').optional().isIn(['discount', 'freebie', 'access', 'course', 'mentorship', 'certification']).withMessage('Invalid perk type'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    body('xp_required').optional().isInt({ min: 0, max: 100000 }).withMessage('XP required must be 0-100000'),
    body('max_redemptions').optional().isInt({ min: 1 }).withMessage('Max redemptions must be positive integer'),
    body('target_roles').optional().isArray().withMessage('Target roles must be an array'),
    body('valid_from').optional().isISO8601().withMessage('Valid from must be a valid date'),
    body('valid_until').optional().isISO8601().withMessage('Valid until must be a valid date'),
    body('external_url').optional().isURL().withMessage('External URL must be valid'),
    body('image_url').optional().isURL().withMessage('Image URL must be valid'),
    body('promo_code').optional().trim().isLength({ max: 100 }).withMessage('Promo code must be less than 100 characters'),
    validateRequest
  ],
  redeem: [
    param('id').isUUID().withMessage('Invalid perk ID'),
    validateRequest
  ],
  getById: [
    param('id').isUUID().withMessage('Invalid perk ID'),
    validateRequest
  ],
  getByCategory: [
    param('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category must be 1-100 characters'),
    validateRequest
  ],
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('type').optional().isIn(['discount', 'freebie', 'access', 'course', 'mentorship', 'certification']).withMessage('Invalid perk type'),
    query('category').optional().trim().isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
    query('featured').optional().isBoolean().withMessage('Featured must be boolean'),
    query('available_only').optional().isBoolean().withMessage('Available only must be boolean'),
    query('max_xp').optional().isInt({ min: 0 }).withMessage('Max XP must be non-negative integer'),
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Search term must be less than 200 characters'),
    validateRequest
  ],
  getUserRedeemed: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validateRequest
  ],
  getAvailable: [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validateRequest
  ],
  toggleFeatured: [
    param('id').isUUID().withMessage('Invalid perk ID'),
    body('featured').optional().isBoolean().withMessage('Featured must be boolean'),
    validateRequest
  ],
  getRedemptions: [
    param('id').isUUID().withMessage('Invalid perk ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validateRequest
  ]
};

// Public routes (with optional authentication for personalization)
router.get('/', optionalAuth, perkValidation.list, perkController.getAllPerks);
router.get('/featured', optionalAuth, perkController.getFeaturedPerks);
router.get('/category/:category', optionalAuth, perkValidation.getByCategory, perkController.getPerksByCategory);
router.get('/:id', optionalAuth, perkValidation.getById, perkController.getPerkById);

// Protected routes - require authentication
router.use(authenticate);

// User perk management
router.post('/:id/redeem', perkValidation.redeem, perkController.redeemPerk);
router.get('/my/redeemed', perkValidation.getUserRedeemed, perkController.getUserRedeemedPerks);
router.get('/my/available', perkValidation.getAvailable, perkController.getAvailablePerks);

// Admin routes - perk management
router.post('/', requireAdmin, perkValidation.create, perkController.createPerk);
router.put('/:id', requireAdmin, perkValidation.update, perkController.updatePerk);
router.delete('/:id', requireAdmin, perkValidation.getById, perkController.deletePerk);
router.put('/:id/feature', requireAdmin, perkValidation.toggleFeatured, perkController.togglePerkFeatured);

// Admin routes - analytics
router.get('/admin/stats', requireAdmin, perkController.getPerkStats);
router.get('/:id/redemptions', requireAdmin, perkValidation.getRedemptions, perkController.getPerkRedemptions);

module.exports = router;