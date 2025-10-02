
// src/services/authService.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Prefer explicit models if available
const models = require('../models');
const PasswordReset = models.PasswordReset || null;
const MagicToken = models.MagicToken || null;

const JWT_SECRET = process.env.JWT_SECRET || (config.jwt && config.jwt.secret);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (config.jwt && config.jwt.refreshSecret) || JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (config.jwt && config.jwt.expiresIn) || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || (config.jwt && config.jwt.refreshExpiresIn) || '30d';
const JWT_ISSUER = (process.env.JWT_ISSUER || (config.jwt && config.jwt.issuer) || 'eph-backend');

if (typeof JWT_ISSUER !== 'string') {
  throw new Error('JWT_ISSUER must be a string');
}

function generateRandomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

async function markRecordUsed(rec) {
  // Try common field names
  if (!rec) return null;
  if (typeof rec.update === 'function') {
    try {
      // Prefer `used` flag if present
      const updateObj = {};
      if ('used' in rec) updateObj.used = true;
      if ('is_used' in rec) updateObj.is_used = true;
      if (Object.keys(updateObj).length > 0) {
        return await rec.update(updateObj);
      }
      // If no 'used' field, try setting a generic status or deleted flag (adapt per model)
      if ('status' in rec) {
        return await rec.update({ status: 'used' });
      }
      // Fallback: set a `used_at` timestamp if available
      if ('used_at' in rec) {
        return await rec.update({ used_at: new Date() });
      }
      // As last resort try setting 'used' field anyway (may add column)
      return await rec.update({ used: true }).catch(() => rec);
    } catch (err) {
      // swallow model update error and return original rec
      return rec;
    }
  }
  return rec;
}

const authService = {
  // Generate JWT token (access)
  generateToken: (user) => {
    if (!JWT_SECRET) {
      throw new Error('JWT secret is not configured. Set JWT_SECRET in environment or config.');
    }
    if (!user || !user.id) {
      throw new Error('User object with "id" is required to generate token.');
    }

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER
    });
  },

  // Verify JWT token (access)
  verifyToken: (token) => {
    if (!JWT_SECRET) {
      throw new Error('JWT secret is not configured. Set JWT_SECRET in environment or config.');
    }
    try {
      return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
    } catch (error) {
      throw new Error('Invalid token: ' + (error.message || error));
    }
  },

  // Generate refresh token
  generateRefreshToken: (user) => {
    if (!JWT_REFRESH_SECRET) {
      throw new Error('JWT refresh secret is not configured. Set JWT_REFRESH_SECRET in environment or config.');
    }
    if (!user || !user.id) {
      throw new Error('User object with "id" is required to generate refresh token.');
    }

    const payload = {
      sub: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: JWT_ISSUER
    });
  },

  // Verify refresh token
  verifyRefreshToken: (token) => {
    if (!JWT_REFRESH_SECRET) {
      throw new Error('JWT refresh secret is not configured. Set JWT_REFRESH_SECRET in environment or config.');
    }
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, { issuer: JWT_ISSUER });
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token: ' + (error.message || error));
    }
  },

  // Extract token from Authorization header
  extractTokenFromHeader: (authHeader) => {
    if (!authHeader || typeof authHeader !== 'string') return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }
    return null;
  },

  //
  // Password reset helpers (uses PasswordReset model)
  //
  // createPasswordResetToken: creates a token record for the user.
  // opts: { expiresInSeconds, ipAddress, userAgent }
  createPasswordResetToken: async (userId, opts = {}) => {
  const expiresInSeconds = opts.expiresInSeconds || (config.auth && config.auth.passwordResetExpirySeconds) || 3600;
  const token = generateRandomToken(28);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  if (!PasswordReset) {
    throw new Error('PasswordReset model not available. Ensure models.PasswordReset is exported.');
  }

  // sanitize ip and ua to primitives
  const ip = (typeof opts.ipAddress === 'string') ? opts.ipAddress : (opts.ipAddress ? String(opts.ipAddress) : null);
  const ua = (typeof opts.userAgent === 'string') ? opts.userAgent : (opts.userAgent ? String(opts.userAgent) : null);

  let rec;
  if (typeof PasswordReset.createForUser === 'function') {
    rec = await PasswordReset.createForUser(userId, {
      token,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: ua
    });
  } else {
    const payload = {
      token,
      user_id: userId,
      expires_at: expiresAt,
      used: false
    };
    if ('ip_address' in (PasswordReset.rawAttributes || {})) payload.ip_address = ip;
    if ('user_agent' in (PasswordReset.rawAttributes || {})) payload.user_agent = ua;
    rec = await PasswordReset.create(payload);
  }

  // return plain object
  try {
    return {
      id: rec && (rec.id || (typeof rec.get === 'function' && rec.get('id'))) || null,
      token: rec && (rec.token || (typeof rec.get === 'function' && rec.get('token'))) || token,
      expires_at: rec && (rec.expires_at || rec.expiresAt || expiresAt) || expiresAt
    };
  } catch (e) {
    return { id: null, token, expires_at: expiresAt };
  }
},

  // validatePasswordResetToken: returns the record if valid (not used & not expired)
  validatePasswordResetToken: async (token) => {
    if (!PasswordReset) {
      throw new Error('PasswordReset model not available. Ensure models.PasswordReset is exported.');
    }

    if (typeof PasswordReset.findValidToken === 'function') {
      // model helper expected to return a valid record or null
      return PasswordReset.findValidToken(token);
    }

    // Fallback: manual check
    const rec = await PasswordReset.findOne({ where: { token } });
    if (!rec) return null;

    // check used flag
    if ('used' in rec && rec.used) return null;
    if ('is_used' in rec && rec.is_used) return null;

    // check expiry
    const expiresAt = rec.expires_at || rec.expiresAt || rec.expires;
    if (expiresAt && new Date(expiresAt) < new Date()) return null;

    return rec;
  },

  // Mark a password reset or magic token record as used (single place)
  markTokenAsUsed: async (record) => {
    if (!record) return null;
    return markRecordUsed(record);
  },

  //
  // Magic-token helpers (for admin magic links and short-lived oauth tokens).
  // Prefer MagicToken model if present, else reuse PasswordReset model with `purpose` field.
  //
  // createMagicToken({ userId, purpose = 'magic', expiresInSeconds = 600 })
  createMagicToken: async ({ userId, purpose = 'magic', expiresInSeconds = 600 } = {}) => {
    const token = generateRandomToken(28);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // If MagicToken model exists, use it
    if (MagicToken) {
      if (typeof MagicToken.create === 'function') {
        return MagicToken.create({
          token,
          user_id: userId,
          purpose,
          expires_at: expiresAt,
          used: false
        });
      }
      // If helper exists
      if (typeof MagicToken.createForUser === 'function') {
        return MagicToken.createForUser(userId, { token, purpose, expires_at: expiresAt });
      }
    }

    // Fallback to PasswordReset model if it has a purpose column
    if (PasswordReset) {
      const attrs = PasswordReset.rawAttributes || {};
      const payload = {
        token,
        user_id: userId,
        expires_at: expiresAt,
        used: false
      };
      if ('purpose' in attrs) {
        payload.purpose = purpose;
      }
      // store but caller should be aware that PasswordReset now doubles as magic token
      return PasswordReset.create(payload);
    }

    throw new Error('No suitable model found for magic tokens (MagicToken or PasswordReset required).');
  },

  // validateMagicToken(token): returns record if valid & not used & not expired
  validateMagicToken: async (token) => {
    // If MagicToken model exists and has helper
    if (MagicToken) {
      if (typeof MagicToken.findValidToken === 'function') {
        return MagicToken.findValidToken(token);
      }
      // generic lookup
      const rec = await MagicToken.findOne({ where: { token } });
      if (!rec) return null;
      if ('used' in rec && rec.used) return null;
      if ('is_used' in rec && rec.is_used) return null;
      const expiresAt = rec.expires_at || rec.expiresAt || rec.expires;
      if (expiresAt && new Date(expiresAt) < new Date()) return null;
      return rec;
    }

    // Fallback: use PasswordReset if present
    if (PasswordReset) {
      const rec = await PasswordReset.findOne({ where: { token } });
      if (!rec) return null;
      // If PasswordReset has purpose and it's not a magic purpose, treat invalid
      if ('purpose' in (PasswordReset.rawAttributes || {}) && rec.purpose && rec.purpose !== 'magic' && rec.purpose !== 'admin_magic') {
        return null;
      }
      if ('used' in rec && rec.used) return null;
      if ('is_used' in rec && rec.is_used) return null;
      const expiresAt = rec.expires_at || rec.expiresAt || rec.expires;
      if (expiresAt && new Date(expiresAt) < new Date()) return null;
      return rec;
    }

    throw new Error('No suitable model found for magic token validation.');
  },

  // Utility: create token record and return token string + record (convenience)
  createAndReturnMagicToken: async (opts) => {
    const rec = await authService.createMagicToken(opts);
    return { token: rec.token || rec.get && rec.get('token'), record: rec };
  }
};

module.exports = authService;
