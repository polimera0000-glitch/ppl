

const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Auth validation rules
const authValidation = {
  register: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('role')
      .optional()
      .isIn(['student', 'hiring', 'investor', 'admin'])
      .withMessage('Invalid role'),
    
    body('college')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('College name must be less than 200 characters'),
    
    body('branch')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Branch name must be less than 100 characters'),
    
    body('year')
      .optional()
      .isInt({ min: 1, max: 6 })
      .withMessage('Year must be between 1 and 6'),
    
    handleValidationErrors
  ],

  login: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('college')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('College name must be less than 200 characters'),
    
    body('branch')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Branch name must be less than 100 characters'),
    
    body('year')
      .optional()
      .isInt({ min: 1, max: 6 })
      .withMessage('Year must be between 1 and 6'),
    
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    
    body('profile_pic_url')
      .optional()
      .isURL()
      .withMessage('Profile picture must be a valid URL'),
    
    handleValidationErrors
  ],

  changePassword: [
  // Optional: controller enforces old password when needed
  body('currentPassword')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Current password must be a string'),

  // Match isPasswordStrong in controller + UI requirements
  body('newPassword')
    .isString().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must include an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must include a lowercase letter')
    .matches(/\d/).withMessage('Password must include a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must include a special character'),

  handleValidationErrors
],

  forgotPassword: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    handleValidationErrors
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    handleValidationErrors
  ]
};

// User validation rules
const userValidation = {
  addXP: [
    body('points')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Points must be between 1 and 10000'),
    
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Reason must be less than 255 characters'),
    
    handleValidationErrors
  ],

  updateRole: [
    body('role')
      .isIn(['student', 'hiring', 'investor', 'admin'])
      .withMessage('Invalid role'),
    
    handleValidationErrors
  ],

  verifyUser: [
    body('verified')
      .optional()
      .isBoolean()
      .withMessage('Verified must be a boolean'),
    
    handleValidationErrors
  ]
};

// Competition validation rules
const competitionValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),

    body('sponsor')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Sponsor name must be less than 200 characters'),
    
    body('start_date')
      .isISO8601()
      .withMessage('Invalid start date format')
      .isAfter(new Date().toISOString())
      .withMessage('Start date must be in the future'),
    
    body('end_date')
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    
    body('max_team_size')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Max team size must be between 1 and 20'),
    
    body('seats_remaining')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Seats remaining must be at least 1'),
    
    body('stages')
      .optional()
      .isArray()
      .withMessage('Stages must be an array'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    handleValidationErrors
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Description cannot be empty'),

    body('sponsor')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Sponsor name must be less than 200 characters'),
    
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    
    body('max_team_size')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Max team size must be between 1 and 20'),
    
    body('seats_remaining')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Seats remaining cannot be negative'),
    
    body('stages')
      .optional()
      .isArray()
      .withMessage('Stages must be an array'),
    
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
    
    handleValidationErrors
  ],

  register: [
    body('type')
      .isIn(['individual', 'team'])
      .withMessage('Type must be either individual or team'),
    
    body('team_name')
      .if(body('type').equals('team'))
      .notEmpty()
      .withMessage('Team name is required for team registration')
      .isLength({ min: 2, max: 100 })
      .withMessage('Team name must be between 2 and 100 characters'),
    
    body('member_emails')
      .optional()
      .isArray()
      .withMessage('Member emails must be an array'),
    
    body('member_emails.*')
      .optional()
      .isEmail()
      .withMessage('All member emails must be valid email addresses'),
    
    body('abstract')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Abstract must be less than 1000 characters'),
    
    handleValidationErrors
  ]
};

// Registration validation rules
const registrationValidation = {
  updateStatus: [
    body('status')
      .isIn(['pending', 'confirmed', 'rejected', 'cancelled'])
      .withMessage('Invalid registration status'),
    
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback must be less than 1000 characters'),
    
    handleValidationErrors
  ],

  updateScore: [
    body('score')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Score must be between 0 and 100'),
    
    body('rank')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Rank must be a positive integer'),
    
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback must be less than 1000 characters'),
    
    handleValidationErrors
  ],

  submitProject: [
    body('submission_url')
      .isURL()
      .withMessage('Submission URL must be a valid URL'),
    
    handleValidationErrors
  ],

  addMember: [
    body('member_email')
      .isEmail()
      .withMessage('Member email must be a valid email address')
      .normalizeEmail(),
    
    handleValidationErrors
  ]
};

// Video validation rules
const videoValidation = {
  upload: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    
    body('tags')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          const tags = value.split(',').map(tag => tag.trim());
          if (tags.length > 10) {
            throw new Error('Maximum 10 tags allowed');
          }
          return true;
        } else if (Array.isArray(value)) {
          if (value.length > 10) {
            throw new Error('Maximum 10 tags allowed');
          }
          return true;
        }
        return true;
      }),
    
    body('visibility_roles')
      .optional()
      .isArray()
      .withMessage('Visibility roles must be an array'),
    
    body('visibility_roles.*')
      .optional()
      .isIn(['uploader', 'student', 'hiring', 'investor', 'admin'])
      .withMessage('Invalid visibility role'),
    
    handleValidationErrors
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    
    body('tags')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          const tags = value.split(',').map(tag => tag.trim());
          if (tags.length > 10) {
            throw new Error('Maximum 10 tags allowed');
          }
          return true;
        } else if (Array.isArray(value)) {
          if (value.length > 10) {
            throw new Error('Maximum 10 tags allowed');
          }
          return true;
        }
        return true;
      }),
    
    body('visibility_roles')
      .optional()
      .isArray()
      .withMessage('Visibility roles must be an array'),
    
    body('visibility_roles.*')
      .optional()
      .isIn(['uploader', 'student', 'hiring', 'investor', 'admin'])
      .withMessage('Invalid visibility role'),
    
    handleValidationErrors
  ]
};

// Perk validation rules
const perkValidation = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Title must be between 2 and 200 characters'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    
    body('type')
      .isIn(['discount', 'freebie', 'access', 'service', 'merchandise', 'course'])
      .withMessage('Invalid perk type'),
    
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    
    body('xp_required')
      .isInt({ min: 0 })
      .withMessage('XP required must be a non-negative integer'),
    
    body('value')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Value must be a positive number'),
    
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code'),
    
    body('discount_percentage')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Discount percentage must be between 1 and 100'),
    
    body('image_url')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    body('redemption_url')
      .optional()
      .isURL()
      .withMessage('Redemption URL must be a valid URL'),
    
    body('max_redemptions')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max redemptions must be a positive integer'),
    
    body('valid_from')
      .optional()
      .isISO8601()
      .withMessage('Valid from date must be in ISO8601 format'),
    
    body('valid_until')
      .optional()
      .isISO8601()
      .withMessage('Valid until date must be in ISO8601 format')
      .custom((value, { req }) => {
        if (req.body.valid_from && value && new Date(value) <= new Date(req.body.valid_from)) {
          throw new Error('Valid until date must be after valid from date');
        }
        return true;
      }),
    
    body('target_roles')
      .isArray()
      .withMessage('Target roles must be an array'),
    
    body('target_roles.*')
      .isIn(['student', 'hiring', 'investor', 'admin'])
      .withMessage('Invalid target role'),
    
    body('is_featured')
      .optional()
      .isBoolean()
      .withMessage('is_featured must be a boolean'),
    
    handleValidationErrors
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Title must be between 2 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Description cannot be empty'),
    
    body('type')
      .optional()
      .isIn(['discount', 'freebie', 'access', 'service', 'merchandise', 'course'])
      .withMessage('Invalid perk type'),
    
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    
    body('xp_required')
      .optional()
      .isInt({ min: 0 })
      .withMessage('XP required must be a non-negative integer'),
    
    body('value')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Value must be a positive number'),
    
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code'),
    
    body('discount_percentage')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Discount percentage must be between 1 and 100'),
    
    body('image_url')
      .optional()
      .isURL()
      .withMessage('Image URL must be a valid URL'),
    
    body('redemption_url')
      .optional()
      .isURL()
      .withMessage('Redemption URL must be a valid URL'),
    
    body('max_redemptions')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max redemptions must be a positive integer'),
    
    body('valid_from')
      .optional()
      .isISO8601()
      .withMessage('Valid from date must be in ISO8601 format'),
    
    body('valid_until')
      .optional()
      .isISO8601()
      .withMessage('Valid until date must be in ISO8601 format'),
    
    body('target_roles')
      .optional()
      .isArray()
      .withMessage('Target roles must be an array'),
    
    body('target_roles.*')
      .optional()
      .isIn(['student', 'hiring', 'investor', 'admin'])
      .withMessage('Invalid target role'),
    
    body('is_active')
      .optional()
      .isBoolean()
      .withMessage('is_active must be a boolean'),
    
    body('is_featured')
      .optional()
      .isBoolean()
      .withMessage('is_featured must be a boolean'),
    
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  authValidation,
  userValidation,
  competitionValidation,
  registrationValidation,
  videoValidation,
  perkValidation,
  validationResult
};