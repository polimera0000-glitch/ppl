const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireHiringOrInvestor, requireAnyRole } = require('../middleware/roleCheck');
const submissionController = require('../controllers/submissionController');

const router = express.Router();

router.use(authenticate);

// User routes
router.post('/:competitionId', requireAnyRole, submissionController.createSubmission);
router.get('/my', requireAnyRole, submissionController.listMySubmissions);

// Admin/Judges routes
router.get('/competition/:competitionId', requireHiringOrInvestor, submissionController.listCompetitionSubmissions);
router.get('/:id', requireHiringOrInvestor, submissionController.getSubmission);
router.post('/:id/score', requireHiringOrInvestor, submissionController.scoreSubmission);

// Admin routes
router.put('/:id', requireAdmin, submissionController.updateSubmission); // NEW: This was missing!
router.post('/:id/status', requireAdmin, submissionController.setStatus);
router.post('/competition/:competitionId/publish', requireAdmin, submissionController.publishResults);
router.get('/competition/:competitionId/leaderboard', submissionController.leaderboard); // public-ish, still behind auth

module.exports = router;