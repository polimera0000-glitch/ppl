// routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware to validate request and handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().reduce((acc, err) => {
        if (!acc[err.path]) acc[err.path] = [];
        acc[err.path].push(err.msg);
        return acc;
      }, {})
    });
  }
  next();
};

// All admin routes require authentication
router.use(authenticate);

// POST /admin/invite - Invite new admin
router.post('/invite', 
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2-100 characters'),
  ],
  handleValidationErrors,
  adminController.inviteAdmin
);

// GET /admin/list - Get all admins
router.get('/list', adminController.getAdmins);

// DELETE /admin/:adminId/deactivate - Deactivate admin
router.delete('/:adminId/deactivate', 
  [
    body().custom((value, { req }) => {
      // Validate UUID format for adminId param
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.adminId)) {
        throw new Error('Invalid admin ID format');
      }
      return true;
    })
  ],
  handleValidationErrors,
  adminController.deactivateAdmin
);

module.exports = router;