const express = require('express');
const registrationController = require('../controllers/registrationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireHiringOrInvestor } = require('../middleware/roleCheck');
const { registrationValidation } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// General registration routes
router.get('/', requireHiringOrInvestor, registrationController.getAllRegistrations);
router.get('/:id', registrationController.getRegistrationById);

// Admin routes - registration management
router.put('/:id/status', requireAdmin, registrationValidation.updateStatus, registrationController.updateRegistrationStatus);
router.put('/:id/score', requireAdmin, registrationValidation.updateScore, registrationController.updateRegistrationScore);

// Student routes - project submission and team management
router.post('/:id/submit', registrationValidation.submitProject, registrationController.submitProject);
router.post('/:id/members', registrationValidation.addMember, registrationController.addTeamMember);
router.delete('/:id/members/:memberId', registrationController.removeTeamMember);

// Public leaderboard route (requires auth but available to all roles)
router.get('/competition/:competitionId/leaderboard', registrationController.getCompetitionLeaderboard);

module.exports = router;