const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin, requireHiringOrInvestor } = require('../middleware/roleCheck');
const { userValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes (with optional auth for context)
router.get('/leaderboard', optionalAuth, userController.getLeaderboard);
router.get('/college/:college', optionalAuth, userController.getUsersByCollege);

// Protected routes - require authentication
router.use(authenticate);

// User profile and details
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.get('/:id/stats', userController.getUserStats);
router.get('/:id/badges', userController.getUserBadges);

// Admin only routes
router.post('/:id/xp', requireAdmin, userValidation.addXP, userController.addUserXP);
router.put('/:id/role', requireAdmin, userValidation.updateRole, userController.updateUserRole);
router.put('/:id/verify', requireAdmin, userValidation.verifyUser, userController.verifyUser);
router.put('/:id/deactivate', requireAdmin, userController.deactivateUser);
router.put('/:id/reactivate', requireAdmin, userController.reactivateUser);

module.exports = router;