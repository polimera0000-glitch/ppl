// src/routes/competitions.js
const express = require('express');
const competitionController = require('../controllers/competitionController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  requireAdmin,
  requireHiringOrInvestor,
  requireAnyRole
} = require('../middleware/roleCheck');
const { competitionValidation } = require('../middleware/validation');

const router = express.Router();

/* ------------------- Public routes (optional auth) ------------------- */
router.get('/', optionalAuth, competitionController.getAllCompetitions);
router.get('/:id', optionalAuth, competitionController.getCompetitionById);

/* ---------------- Protected routes (require login) ------------------- */
router.use(authenticate);

/* ---- Student routes (competition registration / my competitions) ---- */
router.post(
  '/:id/register',
  requireAnyRole,
  competitionValidation.register,
  competitionController.registerForCompetition
);
router.get('/my/registrations', competitionController.getUserRegistrations);
router.delete(
  '/registrations/:registrationId',
  competitionController.cancelRegistration
);
router.post(
  '/registrations/:registrationId/complete',
  competitionController.completeTeamRegistration
);

// Get user's registration status for a competition
router.get(
  '/:id/registration-status',
  competitionController.getRegistrationStatus
);

// Get complete user context for competition page
router.get(
  '/:id/user-context',
  competitionController.getUserContext
);

/* ------------------- Admin routes (CRUD competitions) ------------------- */
router.post(
  '/',
  requireAdmin,
  competitionValidation.create,
  competitionController.createCompetition
);
router.put(
  '/:id',
  requireAdmin,
  competitionValidation.update,
  competitionController.updateCompetition
);
router.delete('/:id', requireAdmin, competitionController.deleteCompetition);

/* -------- Admin/Hiring/Investor routes (view registrations) ---------- */
router.get(
  '/:id/registrations',
  requireHiringOrInvestor,
  competitionController.getCompetitionRegistrations
);

router.get(
  '/:id/leaderboard',
  competitionController.getCompetitionLeaderboard
);


module.exports = router;