// src/routes/payments.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const paymentController = require('../controllers/paymentController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

const router = express.Router();

// Rate limiting for payment operations
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: {
    success: false,
    message: 'Too many payment requests, please try again later'
  }
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation rules
const createPaymentValidation = [
  body('competitionId')
    .isUUID()
    .withMessage('Valid competition ID is required'),
  body('userType')
    .isIn(['undergraduate', 'graduate'])
    .withMessage('User type must be undergraduate or graduate'),
  body('teamSize')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Team size must be between 1 and 10'),
  body('teamName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters'),
  handleValidationErrors
];

const orderIdValidation = [
  param('orderId')
    .isLength({ min: 10, max: 100 })
    .withMessage('Valid order ID is required'),
  handleValidationErrors
];

// Public routes (for payment callbacks)
// Payment gateway callback/webhook (no authentication required)
router.post('/callback', paymentController.handlePaymentCallback);

// Payment success/failure redirect pages (optional auth for better UX)
router.get('/success/:orderId', optionalAuth, orderIdValidation, paymentController.getPaymentSuccess);
router.get('/failure/:orderId', optionalAuth, orderIdValidation, paymentController.getPaymentFailure);



// Protected routes (require authentication)
router.use(authenticate);

// Create payment order for competition registration
router.post('/create', paymentLimiter, createPaymentValidation, paymentController.createPaymentOrder);

// Get payment status
router.get('/status/:orderId', orderIdValidation, paymentController.getPaymentStatus);



// Get user's payment history
router.get('/history', paymentController.getPaymentHistory);

// Verify payment (for manual verification if needed)
router.post('/verify/:orderId', orderIdValidation, paymentController.verifyPayment);

// Cancel payment order (if supported by gateway)
router.post('/cancel/:orderId', orderIdValidation, paymentController.cancelPayment);

module.exports = router;