// middleware/auth.js
const { User } = require('../models');
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Helper: extract token from multiple possible sources
 */
function extractToken(req) {
  // 1) Authorization header (Bearer)
  const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
  let token = authService.extractTokenFromHeader(authHeader);

  // 2) x-access-token header
  if (!token && req.headers && (req.headers['x-access-token'] || req.headers['X-Access-Token'])) {
    token = req.headers['x-access-token'] || req.headers['X-Access-Token'];
  }

  // 3) query param
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  // 4) body param
  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  // 5) cookies (if cookie-parser is used)
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  return token || null;
}

/**
 * Authenticate middleware - requires a valid JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token using authService (throws on invalid/expired)
    let decoded;
    try {
      decoded = authService.verifyToken(token);
      logger.info(`Token verified for user: ${decoded.sub || decoded.id}`);
    } catch (err) {
      logger.warn('Token verification failed', { err: err.message || err });
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('expired')) {
        return res.status(401).json({ success: false, message: 'Token has expired' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // decoded may contain sub or id depending on signing
    const userId = decoded && (decoded.sub || decoded.id || decoded.userId || decoded.uid);
    if (!userId) {
      logger.warn('Token decoded but no user id found', { decoded });
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.is_active) {
      logger.warn('Authenticated user not found or inactive', { userId });
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      force_password_change: !!user.force_password_change,
      is_active: !!user.is_active,
    };

    logger.info(`User authenticated: ${user.email} (${user.role})`);

    return next();
  } catch (error) {
    logger.error('Authentication error:', error && (error.stack || error.message || error));
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - if a valid token is present, set req.user, otherwise continue anonymously.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      logger.info('Optional auth: No token provided, continuing as anonymous');
      req.user = null;
      return next();
    }

    try {
      const decoded = authService.verifyToken(token);
      const userId = decoded && (decoded.sub || decoded.id || decoded.userId || decoded.uid);
      if (!userId) {
        req.user = null;
        return next();
      }

      const user = await User.findByPk(userId);
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        };
        logger.info(`Optional auth: User authenticated: ${user.email} (${user.role})`);
      } else {
        req.user = null;
        logger.info('Optional auth: User not found or inactive');
      }
    } catch (err) {
      logger.info('Optional auth token invalid/expired - continuing anonymously', { err: err.message || err });
      req.user = null;
    }

    return next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error && (error.stack || error.message || error));
    req.user = null;
    return next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};