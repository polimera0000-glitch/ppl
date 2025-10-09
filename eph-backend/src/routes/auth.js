// routes/auth.js
const express = require('express');
const authController = require('../controllers/authController');
const oauthController = require('../controllers/oauthController');
const { authenticate } = require('../middleware/auth');

// validation might be missing or partially exported
let { authValidation } = (() => {
  try {
    return require('../middleware/validation');
  } catch {
    return { authValidation: null };
  }
})();

const v = authValidation || {};
const noop = (req, _res, next) => next();

const router = express.Router();

// PUBLIC
router.post('/register', v.register || noop, authController.register);
router.post('/login', v.login || noop, authController.login);

// Admin magic link (public endpoint but generic response)
if (typeof authController.adminMagicLink === 'function') {
  router.post('/admin-magic-link', v.forgotPassword || noop, authController.adminMagicLink);
}

// Consume magic token
if (typeof authController.consumeMagicToken === 'function') {
  router.post('/consume-magic', (v.consumeMagic || noop), authController.consumeMagicToken);
}

// OAuth routes
router.get('/google', oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);
router.get('/github', oauthController.githubAuth);
router.get('/github/callback', oauthController.githubCallback);
router.post('/oauth/exchange', oauthController.exchangeOAuthCode);

// Forgot / reset password
router.post('/forgot-password', v.forgotPassword || noop, authController.forgotPassword);
router.post('/reset-password', v.resetPassword || noop, authController.resetPassword);

router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);
router.post('/resend-verification-public', authController.resendVerificationPublic);

// PROTECTED
router.use(authenticate);
router.get('/profile', authController.profile);
router.put('/profile', v.updateProfile || noop, authController.updateProfile);
router.post('/change-password', v.changePassword || noop, authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;
