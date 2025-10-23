const express = require('express');
const rateLimit = require('express-rate-limit');
const invitationController = require('../controllers/invitationController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for invitation sending (prevent spam)
const invitationSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 invitation sends per windowMs
  message: {
    success: false,
    error: 'Too many invitation requests from this IP, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for invitation responses (prevent abuse)
const invitationResponseLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 responses per windowMs
  message: {
    success: false,
    error: 'Too many invitation responses from this IP, please try again later.',
    retryAfter: 5
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validation rules
const sendInvitationsValidation = [
  body('registrationId')
    .isUUID()
    .withMessage('Registration ID must be a valid UUID'),
  body('emails')
    .isArray({ min: 1, max: 10 })
    .withMessage('Emails must be an array with 1-10 items'),
  body('emails.*')
    .isEmail()
    .normalizeEmail()
    .withMessage('Each email must be valid'),
  handleValidationErrors
];

const respondToInvitationValidation = [
  param('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid invitation token'),
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage('Action must be "accept" or "reject"'),
  handleValidationErrors
];

const invitationIdValidation = [
  param('invitationId')
    .isUUID()
    .withMessage('Invitation ID must be a valid UUID'),
  handleValidationErrors
];

const registrationIdValidation = [
  param('registrationId')
    .isUUID()
    .withMessage('Registration ID must be a valid UUID'),
  handleValidationErrors
];

const tokenValidation = [
  param('token')
    .isLength({ min: 32, max: 128 })
    .withMessage('Invalid invitation token'),
  handleValidationErrors
];

// Public routes (no authentication required)
// Serve invitation response page
router.get('/respond/:token', tokenValidation, invitationController.serveInvitationResponsePage);

// Get invitation details by token (for invitation response page)
router.get('/token/:token', tokenValidation, invitationController.getInvitationByToken);

// Respond to invitation (can be done by non-authenticated users)
router.post('/respond/:token', invitationResponseLimiter, optionalAuth, respondToInvitationValidation, invitationController.respondToInvitation);

// Authenticated routes
router.use(authenticate);

// Send team invitations (team leaders only)
router.post('/send', invitationSendLimiter, sendInvitationsValidation, invitationController.sendInvitations);

// Get invitation status for a registration (team leaders and admins)
router.get('/status/:registrationId', registrationIdValidation, invitationController.getInvitationStatus);

// Resend invitation (team leaders only)
router.post('/resend/:invitationId', invitationIdValidation, invitationController.resendInvitation);

// Cancel invitation (team leaders only)
router.delete('/:invitationId', invitationIdValidation, invitationController.cancelInvitation);

// Get user's received invitations
router.get('/my-invitations', [
  query('status')
    .optional()
    .isIn(['all', 'pending', 'accepted', 'rejected', 'expired'])
    .withMessage('Status must be one of: all, pending, accepted, rejected, expired'),
  handleValidationErrors
], invitationController.getMyInvitations);

module.exports = router;