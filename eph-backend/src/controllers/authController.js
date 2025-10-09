// // controllers/authController.js - Enhanced version with better error messages
// const { User } = require('../models');
// const authService = require('../services/authService');
// const emailService = require('../services/emailService');
// const logger = require('../utils/logger');
// const config = require('../config');

// const authController = {
//   // Modified login to check for force_password_change
//   login: async (req, res) => {
//     try {
//       const { email, password, role } = req.body;

//       // Find user by email
//       const user = await User.findByEmail(email);
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid email or password'
//         });
//       }

//       // Optionally check role hint (soft enforcement)
//       if (role && user.role !== role) {
//         return res.status(403).json({
//           success: false,
//           message: `User does not have the '${role}' role`
//         });
//       }

//       // Verify password
//       const isValidPassword = await user.validatePassword(password);
//       if (!isValidPassword) {
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid email or password'
//         });
//       }

//       // Update last login
//       user.last_login = new Date();
//       await user.save();

//       // Generate JWT token
//       const token = authService.generateToken(user);

//       // Check if user must change password (for newly invited admins)
//       const mustChangePassword = user.force_password_change === true;

//       res.json({
//         success: true,
//         message: 'Login successful',
//         data: {
//           user: user.toJSON(),
//           token,
//           mustChangePassword
//         }
//       });

//     } catch (error) {
//       logger.error('Login error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Login failed',
//         error: error.message
//       });
//     }
//   },

//   // Enhanced change password to handle force_password_change flag
//   changePassword: async (req, res) => {
//     try {
//       const { currentPassword, newPassword } = req.body;
//       const user = await User.findByPk(req.user.id);

//       if (!user) {
//         return res.status(404).json({ 
//           success: false, 
//           message: 'User not found' 
//         });
//       }

//       // If NOT a forced change, verify the current password
//       if (!user.force_password_change) {
//         const ok = await user.validatePassword(currentPassword);
//         if (!ok) {
//           return res.status(400).json({ 
//             success: false, 
//             message: 'Current password is incorrect' 
//           });
//         }
//       }

//       // Strength check
//       if (!isPasswordStrong(newPassword)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
//         });
//       }

//       // Update
//       user.password_hash = newPassword;
//       user.force_password_change = false;
//       user.password_changed_at = new Date();
//       await user.save();

//       // Fire-and-forget notification
//       emailService
//         .sendPasswordChangedNotification(user.email, user.name)
//         .then(() => logger.info('Password change notification sent', { userId: user.id }))
//         .catch((err) => logger.warn('Failed to send password change notification', { error: err?.message }));

//       const safeUser = {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         is_verified: !!user.is_verified,
//         force_password_change: !!user.force_password_change,
//       };

//       return res.json({
//         success: true,
//         message: 'Password changed successfully',
//         data: { user: safeUser },
//       });
//     } catch (error) {
//       logger.error('Password change error:', error);
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to change password',
//         error: error?.message,
//       });
//     }
//   },

//   // Modified register with cleaner error handling
//   register: async (req, res) => {
//     try {
//       const {
//         name,
//         email,
//         password,
//         role = 'student',
//         college,
//         branch,
//         year,
//         company_name,
//         company_website,
//         team_size,
//         firm_name,
//         investment_stage,
//         website,
//       } = req.body;

//       // Validate required fields first
//       if (!name || !name.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: 'Name is required'
//         });
//       }

//       if (!email || !email.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: 'Email is required'
//         });
//       }

//       if (!password) {
//         return res.status(400).json({
//           success: false,
//           message: 'Password is required'
//         });
//       }

//       // Validate email format
//       const emailRegex = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/;
//       if (!emailRegex.test(email.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: 'Please enter a valid email address'
//         });
//       }

//       // Check Gmail requirement
//       const emailLower = email.toLowerCase().trim();
//       if (!emailLower.endsWith('@gmail.com')) {
//         return res.status(400).json({
//           success: false,
//           message: 'Only Gmail addresses (@gmail.com) are allowed for registration'
//         });
//       }

//       // Prevent admin role registration
//       if (role === 'admin') {
//         return res.status(403).json({
//           success: false,
//           message: 'Admin accounts can only be created by existing admins'
//         });
//       }

//       // Validate password strength
//       if (password.length < 6) {
//         return res.status(400).json({
//           success: false,
//           message: 'Password must be at least 6 characters long'
//         });
//       }

//       // Check if user already exists
//       const existingUser = await User.findByEmail(emailLower);
//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           message: 'An account with this email already exists'
//         });
//       }

//       // Validate year if provided
//       if (year !== undefined && year !== null && year !== '') {
//         const parsedYear = parseInt(year, 10);
//         if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 10) {
//           return res.status(400).json({
//             success: false,
//             message: 'Year must be a valid number between 1 and 10'
//           });
//         }
//       }

//       // Prepare userData
//       const userData = {
//         name: name.trim(),
//         email: emailLower,
//         password_hash: password,
//         role: ['student', 'hiring', 'investor'].includes(role) ? role : 'student',
//         force_password_change: false,
//         is_active: true,
//         verified: false
//       };

//       // Add optional fields for students
//       if (role === 'student') {
//         if (college) userData.college = college.trim();
//         if (branch) userData.branch = branch.trim();
//         if (year) userData.year = parseInt(year, 10);
//       }

//       // Add optional fields for hiring
//       if (role === 'hiring') {
//         if (company_name) userData.company_name = company_name.trim();
//         if (company_website) userData.company_website = company_website.trim();
//         if (team_size) userData.team_size = parseInt(team_size, 10);
//       }

//       // Add optional fields for investors
//       if (role === 'investor') {
//         if (firm_name) userData.firm_name = firm_name.trim();
//         if (investment_stage) userData.investment_stage = investment_stage.trim();
//         if (website) userData.website = website.trim();
//       }

//       // Create new user
//       const user = await User.create(userData);

//       // Generate JWT token
//       const token = authService.generateToken(user);

//       // Send welcome email (fire-and-forget)
//       emailService.sendWelcomeEmail(user.email, user.name)
//         .then(() => logger.info('Welcome email sent', { to: user.email }))
//         .catch((err) => logger.warn('Failed to send welcome email', { error: err?.message }));

//       return res.status(201).json({
//         success: true,
//         message: 'Account created successfully',
//         data: {
//           user: user.toJSON(),
//           token
//         }
//       });

//     } catch (error) {
//       logger.error('Registration error:', error);

//       // Handle Sequelize validation errors
//       if (error?.name === 'SequelizeValidationError') {
//         const firstError = error.errors?.[0];
//         return res.status(400).json({
//           success: false,
//           message: firstError?.message || 'Validation failed'
//         });
//       }

//       // Handle unique constraint errors
//       if (error?.name === 'SequelizeUniqueConstraintError') {
//         return res.status(400).json({
//           success: false,
//           message: 'An account with this email already exists'
//         });
//       }

//       return res.status(500).json({
//         success: false,
//         message: 'Registration failed. Please try again.'
//       });
//     }
//   },

//   // Get current user profile
//   profile: async (req, res) => {
//   try {
//     const user = await User.findByPk(req.user.id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: { user: user.toJSON() }
//     });

//   } catch (error) {
//     logger.error('Profile fetch error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch profile',
//       error: error.message
//     });
//   }
// },


//   // Update user profile
//   // Update user profile
// updateProfile: async (req, res) => {
//   try {
//     const {
//       name, college, branch, year, skills, profile_pic_url,
//       phone, org, country,

//       // NEW fields from frontend
//       gender,                 // 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
//       edu_type,               // 'undergraduate' | 'graduate' | 'other'
//       work_experience_years,  // number

//       // Consent flags (booleans). If true, set timestamps to now.
//       agree_tnc,
//       agree_privacy,
//     } = req.body;
    
//     const user = await User.findByPk(req.user.id);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const updateData = {};

//     if (name) updateData.name = String(name);
//     if (college) updateData.college = String(college);
//     if (branch) updateData.branch = String(branch);
//     if (year !== undefined && year !== null && year !== '') {
//       const y = parseInt(year, 10);
//       if (Number.isNaN(y) || y < 1 || y > 10) {
//         return res.status(400).json({ success: false, message: 'Year must be a number between 1 and 10' });
//       }
//       updateData.year = y;
//     }
//     if (Array.isArray(skills)) updateData.skills = skills;
//     if (phone) updateData.phone = String(phone);
//     if (org) updateData.org = String(org);
//     if (country) updateData.country = String(country);
//     if (profile_pic_url) updateData.profile_pic_url = String(profile_pic_url);

//     // --- NEW validations + assignments ---
//     const GENDERS = new Set(['male','female','non_binary','prefer_not_to_say']);
//     const EDU_TYPES = new Set(['undergraduate','graduate','other']);

//     if (gender !== undefined) {
//       if (!GENDERS.has(gender)) {
//         return res.status(400).json({ success: false, message: 'Invalid gender' });
//       }
//       updateData.gender = gender;
//     }

//     if (edu_type !== undefined) {
//       if (!EDU_TYPES.has(edu_type)) {
//         return res.status(400).json({ success: false, message: 'Invalid edu_type' });
//       }
//       updateData.edu_type = edu_type;
//     }

//     if (work_experience_years !== undefined && work_experience_years !== null && work_experience_years !== '') {
//       const w = Number(work_experience_years);
//       if (!Number.isFinite(w) || w < 0 || w > 60) {
//         return res.status(400).json({ success: false, message: 'work_experience_years must be between 0 and 60' });
//       }
//       updateData.work_experience_years = Math.trunc(w);
//     }

//     // Consent timestamps: set only when explicitly true
//     if (agree_tnc === true) {
//       updateData.agreed_tnc_at = new Date();
//     }
//     if (agree_privacy === true) {
//       updateData.agreed_privacy_at = new Date();
//     }

//     await user.update(updateData);

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       data: { user: user.toJSON() }
//     });

//   } catch (error) {
//     logger.error('Profile update error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update profile',
//       error: error.message
//     });
//   }
// },

//   forgotPassword: async (req, res) => {
//     try {
//       const { email } = req.body;
      
//       if (!email) {
//         return res.status(400).json({
//           success: false,
//           message: 'Email is required'
//         });
//       }

//       const user = await User.findByEmail(email);

//       if (!user) {
//         logger.info('Password reset requested for unknown email', { email });
//         return res.json({
//           success: true,
//           message: 'If your email is registered, you will receive a password reset link'
//         });
//       }

//       const resetExpiry = (config?.auth?.passwordResetExpirySeconds) || 3600;
//       const ipAddress = typeof req.ip === 'string' ? req.ip : (req.headers['x-forwarded-for'] || null);
//       const userAgent = (req.get && req.get('User-Agent')) ? req.get('User-Agent') : (req.headers['user-agent'] || null);

//       const resetRecord = await authService.createPasswordResetToken(user.id, {
//         expiresInSeconds: resetExpiry,
//         ipAddress: ipAddress ? String(ipAddress) : null,
//         userAgent: userAgent ? String(userAgent) : null
//       });

//       const tokenString = resetRecord && (resetRecord.token || (typeof resetRecord.get === 'function' && resetRecord.get('token')));
//       if (!tokenString) {
//         logger.error('Password reset token missing after creation');
//         return res.status(500).json({ 
//           success: false, 
//           message: 'Failed to create password reset token' 
//         });
//       }

//       const scheme = (config?.app?.deepLinkScheme) || (process.env.DEEP_LINK_SCHEME || 'eph');
//       const deepLink = `${scheme}://reset-password?token=${encodeURIComponent(tokenString)}`;

//       const frontendBase = (process.env.FRONTEND_URL || (config?.app?.frontendUrl) || 'http://localhost:3000').replace(/\/+$/, '');
//       const webFallback = `${frontendBase}/reset-password?token=${encodeURIComponent(tokenString)}`;

//       await emailService.sendPasswordResetEmail(user.email, user.name, tokenString, { 
//         expiresInSeconds: resetExpiry, 
//         deepLink, 
//         webFallback 
//       });

//       logger.info('Password reset email sent', { to: user.email });
//       return res.json({
//         success: true,
//         message: 'If your email is registered, you will receive a password reset link'
//       });

//     } catch (error) {
//       logger.error('Forgot password error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to process password reset request'
//       });
//     }
//   },

//   resetPassword: async (req, res) => {
//     try {
//       const { token, newPassword } = req.body;

//       if (!token || !newPassword) {
//         return res.status(400).json({
//           success: false,
//           message: 'Token and new password are required'
//         });
//       }

//       const resetRecord = await authService.validatePasswordResetToken(token);
//       if (!resetRecord) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid or expired reset token'
//         });
//       }

//       const user = await User.findByPk(resetRecord.user_id);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }

//       user.password_hash = newPassword;
//       await user.save();

//       await resetRecord.markAsUsed();

//       res.json({
//         success: true,
//         message: 'Password reset successful'
//       });

//     } catch (error) {
//       logger.error('Reset password error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to reset password'
//       });
//     }
//   },

//   logout: async (req, res) => {
//     try {
//       res.json({
//         success: true,
//         message: 'Logged out successfully'
//       });
//     } catch (error) {
//       logger.error('Logout error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Logout failed'
//       });
//     }
//   }
// };

// // Helper function for password strength validation
// function isPasswordStrong(password) {
//   if (!password || password.length < 8) return false;
  
//   const hasUpper = /[A-Z]/.test(password);
//   const hasLower = /[a-z]/.test(password);
//   const hasNumber = /\d/.test(password);
//   const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
//   return hasUpper && hasLower && hasNumber && hasSpecial;
// }

// module.exports = authController;

// controllers/authController.js
const { User } = require('../models');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const config = require('../config');

const authController = {
  // ----------------------------
  // LOGIN (blocked if !is_verified)
  // ----------------------------
  login: async (req, res) => {
    try {
      const { email, password, role } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (role && user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `User does not have the '${role}' role`,
        });
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // BLOCK UNVERIFIED LOGINS
      if (!user.verified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email to continue. Check your inbox for the verification link.',
        });
      }

      user.last_login = new Date();
      await user.save();

      const token = authService.generateToken(user);
      const mustChangePassword = user.force_password_change === true;

      return res.json({
        success: true,
        message: 'Login successful',
        data: { user: user.toJSON(), token, mustChangePassword },
      });
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
  },

  // ----------------------------
  // CHANGE PASSWORD
  // ----------------------------
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (!user.force_password_change) {
        const ok = await user.validatePassword(currentPassword);
        if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      if (!isPasswordStrong(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        });
      }

      user.password_hash = newPassword;
      user.force_password_change = false;
      user.password_changed_at = new Date();
      await user.save();

      emailService
        .sendPasswordChangedNotification(user.email, user.name)
        .then(() => logger.info('Password change notification sent', { userId: user.id }))
        .catch((err) => logger.warn('Failed to send password change notification', { error: err?.message }));

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: !!user.verified,
        force_password_change: !!user.force_password_change,
      };

      return res.json({ success: true, message: 'Password changed successfully', data: { user: safeUser } });
    } catch (error) {
      logger.error('Password change error:', error);
      return res.status(500).json({ success: false, message: 'Failed to change password', error: error?.message });
    }
  },

  // ----------------------------
  // REGISTER (any email) + send verification
  // ----------------------------

  register: async (req, res) => {
  try {
    const {
      name, email, password, role = 'student',
      college, branch, year,
      company_name, company_website, team_size,
      firm_name, investment_stage, website,
      agree_tnc, agree_privacy,
    } = req.body;

    // Validation
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });

    if (agree_tnc !== true || agree_privacy !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the Terms & Conditions and the Privacy Policy to create an account',
      });
    }

    const emailRegex = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts can only be created by existing admins' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findByEmail(emailLower);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    if (year !== undefined && year !== null && year !== '') {
      const parsedYear = parseInt(year, 10);
      if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 10) {
        return res.status(400).json({ success: false, message: 'Year must be a valid number between 1 and 10' });
      }
    }

    const now = new Date();

    const userData = {
      name: name.trim(),
      email: emailLower,
      password_hash: password,
      role: ['student', 'hiring', 'investor'].includes(role) ? role : 'student',
      force_password_change: false,
      is_active: true,
      verified: false,
      agreed_tnc_at: now,
      agreed_privacy_at: now,
    };

    if (role === 'student') {
      if (college) userData.college = college.trim();
      if (branch) userData.branch = branch.trim();
      if (year) userData.year = parseInt(year, 10);
    } else if (role === 'hiring') {
      if (company_name) userData.company_name = company_name.trim();
      if (company_website) userData.company_website = company_website.trim();
      if (team_size) userData.team_size = parseInt(team_size, 10);
    } else if (role === 'investor') {
      if (firm_name) userData.firm_name = firm_name.trim();
      if (investment_stage) userData.investment_stage = investment_stage.trim();
      if (website) userData.website = website.trim();
    }

    const user = await User.create(userData);

    // Create verification token
    const ipAddress = typeof req.ip === 'string' ? req.ip : req.headers['x-forwarded-for'] || null;
    const userAgent = req.get?.('User-Agent') || req.headers['user-agent'] || null;

    const vRec = await authService.createEmailVerificationToken(user.id, {
      ipAddress: ipAddress ? String(ipAddress) : null,
      userAgent: userAgent ? String(userAgent) : null,
    });

    // CRITICAL: Await email send and log result
    logger.info('Attempting to send verification email...', { to: user.email });
    
    const emailResult = await emailService.sendVerificationEmail(
      user.email, 
      user.name, 
      vRec.token
    );

    if (emailResult.success) {
      logger.info('✅ Verification email sent successfully', { 
        to: user.email,
        messageId: emailResult.messageId 
      });
    } else {
      logger.error('❌ Failed to send verification email', { 
        to: user.email,
        error: emailResult.error,
        code: emailResult.code 
      });
      // Don't fail registration, but warn user
      return res.status(201).json({
        success: true,
        message: 'Account created but verification email failed to send. Please contact support.',
        data: { user: user.toJSON() },
        emailError: emailResult.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    logger.error('Registration error:', error);

    if (error?.name === 'SequelizeValidationError') {
      const firstError = error.errors?.[0];
      return res.status(400).json({
        success: false,
        message: firstError?.message || 'Validation failed',
      });
    }

    if (error?.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
},

  // ----------------------------
  // EMAIL VERIFY (GET /auth/verify-email?token=...)
  // ----------------------------
  verifyEmail: async (req, res) => {
  const wantsJson = req.accepts(['html','json']) === 'json' ||
                    /application\/json/.test(req.get('accept') || '');

  try {
    const { token } = req.query;
    if (!token) {
      return wantsJson
        ? res.status(400).json({ success:false, message:'Invalid request: token is missing.' })
        : res.status(400).send(htmlError('Invalid request: token is missing.'));
    }

    const rec = await authService.validateEmailVerificationToken(token);
    if (!rec) {
      return wantsJson
        ? res.status(400).json({ success:false, message:'Invalid, used or expired verification link.' })
        : res.status(400).send(htmlError('Invalid or expired verification link.'));
    }

    const user = await User.findByPk(rec.user_id);
    if (!user) {
      return wantsJson
        ? res.status(404).json({ success:false, message:'User not found.' })
        : res.status(404).send(htmlError('User not found.'));
    }

    if (!user.verified) {
      user.verified = true;
      if ('verified_at' in user) user.verified_at = new Date();
      await user.save();
    }

    await rec.markAsUsed?.();

    emailService
      .sendWelcomeEmail(user.email, user.name)
      .catch(err => logger.warn('Welcome email failed', { error: err?.message }));

    return wantsJson
      ? res.json({ success:true, message:'Email verified.' })
      : res.status(200).send(htmlSuccess());

  } catch (err) {
    logger.error('verifyEmail error:', err);
    return wantsJson
      ? res.status(500).json({ success:false, message:'Server error verifying email.' })
      : res.status(500).send(htmlError('Something went wrong while verifying your email.'));
  }
},

  // ----------------------------
  // RESEND VERIFICATION (optional)
  // ----------------------------
  resendVerification: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (user.verified) return res.json({ success: true, message: 'Email already verified' });

      const ipAddress = typeof req.ip === 'string' ? req.ip : (req.headers['x-forwarded-for'] || null);
      const userAgent = req.get?.('User-Agent') || req.headers['user-agent'] || null;

      const rec = await authService.createEmailVerificationToken(user.id, {
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null,
      });

      await emailService.sendVerificationEmail(user.email, user.name, rec.token);
      return res.json({ success: true, message: 'Verification email sent' });
    } catch (e) {
      logger.error('resendVerification error:', e);
      return res.status(500).json({ success: false, message: 'Failed to send verification email' });
    }
  },

  // controllers/authController.js (add this next to resendVerification)
// controllers/authController.js
resendVerificationPublic: async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const user = await User.findByEmail(email.trim().toLowerCase());
    // Don’t reveal existence
    if (!user) {
      return res.json({ success: true, message: 'If your email is registered, we sent a verification link.' });
    }
    if (user.verified) {
      return res.json({ success: true, message: 'Email already verified. You can log in.' });
    }

    const ip = typeof req.ip === 'string' ? req.ip : (req.headers['x-forwarded-for'] || null);
    const ua = req.get?.('User-Agent') || req.headers['user-agent'] || null;

    const rec = await authService.createEmailVerificationToken(user.id, {
      ipAddress: ip ? String(ip) : null,
      userAgent: ua ? String(ua) : null,
    });

    await emailService.sendVerificationEmail(user.email, user.name, rec.token);
    return res.json({ success: true, message: 'Verification email sent.' });
  } catch (e) {
    logger.error('resendVerificationPublic error:', e);
    return res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
},



  // ----------------------------
  // PROFILE (whoami)
  // ----------------------------
  profile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      return res.json({ success: true, data: { user: user.toJSON() } });
    } catch (error) {
      logger.error('Profile fetch error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
  },

  // ----------------------------
  // UPDATE PROFILE
  // ----------------------------
  updateProfile: async (req, res) => {
    try {
      const {
        name, college, branch, year, skills, profile_pic_url,
        phone, org, country,
        gender,                 // 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
        edu_type,               // 'undergraduate' | 'graduate' | 'other'
        work_experience_years,  // number
        agree_tnc,
        agree_privacy,
      } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const updateData = {};
      if (name) updateData.name = String(name);
      if (college) updateData.college = String(college);
      if (branch) updateData.branch = String(branch);

      if (year !== undefined && year !== null && year !== '') {
        const y = parseInt(year, 10);
        if (Number.isNaN(y) || y < 1 || y > 10) {
          return res.status(400).json({ success: false, message: 'Year must be a number between 1 and 10' });
        }
        updateData.year = y;
      }

      if (Array.isArray(skills)) updateData.skills = skills;
      if (phone) updateData.phone = String(phone);
      if (org) updateData.org = String(org);
      if (country) updateData.country = String(country);
      if (profile_pic_url) updateData.profile_pic_url = String(profile_pic_url);

      const GENDERS = new Set(['male', 'female', 'non_binary', 'prefer_not_to_say']);
      const EDU_TYPES = new Set(['undergraduate', 'graduate', 'other']);

      if (gender !== undefined) {
        if (!GENDERS.has(gender)) return res.status(400).json({ success: false, message: 'Invalid gender' });
        updateData.gender = gender;
      }

      if (edu_type !== undefined) {
        if (!EDU_TYPES.has(edu_type)) return res.status(400).json({ success: false, message: 'Invalid edu_type' });
        updateData.edu_type = edu_type;
      }

      if (work_experience_years !== undefined && work_experience_years !== null && work_experience_years !== '') {
        const w = Number(work_experience_years);
        if (!Number.isFinite(w) || w < 0 || w > 60) {
          return res.status(400).json({ success: false, message: 'work_experience_years must be between 0 and 60' });
        }
        updateData.work_experience_years = Math.trunc(w);
      }

      if (agree_tnc === true) updateData.agreed_tnc_at = new Date();
      if (agree_privacy === true) updateData.agreed_privacy_at = new Date();

      await user.update(updateData);

      return res.json({ success: true, message: 'Profile updated successfully', data: { user: user.toJSON() } });
    } catch (error) {
      logger.error('Profile update error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
  },

  // ----------------------------
  // FORGOT PASSWORD
  // ----------------------------
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

      const user = await User.findByEmail(email);
      if (!user) {
        logger.info('Password reset requested for unknown email', { email });
        return res.json({
          success: true,
          message: 'If your email is registered, you will receive a password reset link',
        });
      }

      const resetExpiry = config?.auth?.passwordResetExpirySeconds || 3600;
      const ipAddress = typeof req.ip === 'string' ? req.ip : (req.headers['x-forwarded-for'] || null);
      const userAgent = req.get?.('User-Agent') || req.headers['user-agent'] || null;

      const resetRecord = await authService.createPasswordResetToken(user.id, {
        expiresInSeconds: resetExpiry,
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null,
      });

      const tokenString =
        resetRecord && (resetRecord.token || (typeof resetRecord.get === 'function' && resetRecord.get('token')));
      if (!tokenString) {
        logger.error('Password reset token missing after creation');
        return res.status(500).json({ success: false, message: 'Failed to create password reset token' });
      }

      const scheme = config?.app?.deepLinkScheme || process.env.DEEP_LINK_SCHEME || 'eph';
      const deepLink = `${scheme}://reset-password?token=${encodeURIComponent(tokenString)}`;

      const frontendBase = (process.env.FRONTEND_URL || config?.app?.frontendUrl || 'http://localhost:3000').replace(
        /\/+$/,
        ''
      );
      const webFallback = `${frontendBase}/reset-password?token=${encodeURIComponent(tokenString)}`;

      await emailService.sendPasswordResetEmail(user.email, user.name, tokenString, {
        expiresInSeconds: resetExpiry,
        deepLink,
        webFallback,
      });

      logger.info('Password reset email sent', { to: user.email });
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      return res.status(500).json({ success: false, message: 'Failed to process password reset request' });
    }
  },

  // ----------------------------
  // RESET PASSWORD
  // ----------------------------
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
      }

      if (!isPasswordStrong(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        });
      }

      const resetRecord = await authService.validatePasswordResetToken(token);
      if (!resetRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      }

      const user = await User.findByPk(resetRecord.user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.password_hash = newPassword;
      await user.save();
      await resetRecord.markAsUsed();

      return res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      logger.error('Reset password error:', error);
      return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
  },

  // ----------------------------
  // LOGOUT
  // ----------------------------
  logout: async (req, res) => {
    try {
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
  },
};

// ----------------------------
// Helpers
// ----------------------------
function isPasswordStrong(password) {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

function htmlSuccess() {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Email Verified</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#f8fafc;margin:0;padding:24px}
    .card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
    h1{margin:0 0 8px;font-size:22px;color:#0f172a}
    p{margin:6px 0;color:#334155}
    .ok{display:inline-block;margin-top:12px;background:#10b981;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none}
    small{display:block;margin-top:10px;color:#64748b}
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ Email successfully verified</h1>
    <p>You can close this window and log in to your account.</p>
    <a class="ok" href="/" onclick="window.close();return true;">Close</a>
    <small>If this window doesn’t close, you can safely return to the app and sign in.</small>
  </div>
</body>
</html>`;
}

function htmlError(msg) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Verification Error</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body{font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#fef2f2;margin:0;padding:24px}
    .card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #fecaca;border-radius:12px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.05)}
    h1{margin:0 0 8px;font-size:20px;color:#991b1b}
    p{margin:6px 0;color:#7f1d1d}
    a{color:#2563eb;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <h1>Couldn’t verify your email</h1>
    <p>${String(msg || 'Invalid or expired link.')}</p>
    <p>Please request a new link from the app and try again.</p>
  </div>
</body>
</html>`;
}

module.exports = authController;
