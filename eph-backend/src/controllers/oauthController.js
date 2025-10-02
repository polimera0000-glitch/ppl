// controllers/oauthController.js
const { User } = require('../models');
const authService = require('../services/authService');
const oauthService = require('../services/oauthService'); // We'll need to create this
const logger = require('../utils/logger');
const config = require('../config');

const oauthController = {
  // Google OAuth - Initiate
  googleAuth: async (req, res) => {
    try {
      const { redirect_uri, state } = req.query;
      
      const authUrl = oauthService.getGoogleAuthUrl({
        redirectUri: redirect_uri,
        state: state
      });

      // For web: redirect to Google
      if (req.get('User-Agent')?.includes('Mozilla')) {
        return res.redirect(authUrl);
      }

      // For mobile: return the URL
      return res.json({
        success: true,
        data: { authUrl }
      });

    } catch (error) {
      logger.error('Google auth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google authentication',
        error: error.message
      });
    }
  },

  // Google OAuth - Callback
  googleCallback: async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn('Google OAuth error:', error);
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authorization code missing')}`);
    }

    // Exchange code for tokens and user info
    const googleUser = await oauthService.getGoogleUserFromCode(code);

    // Find or create user
    let user = await User.findByEmail(googleUser.email);

    if (!user) {
      // Create new user with Google info
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        password_hash: 'oauth_google', // Placeholder - won't be used
        role: 'student', // Default role
        profile_pic_url: googleUser.picture,
        is_verified: googleUser.email_verified || false,
        oauth_provider: 'google',
        oauth_id: googleUser.id
      });
    } else {
      // Update existing user with Google info if not already set
      const updateData = {};
      if (!user.profile_pic_url && googleUser.picture) {
        updateData.profile_pic_url = googleUser.picture;
      }
      if (!user.is_verified && googleUser.email_verified) {
        updateData.is_verified = true;
      }
      if (!user.oauth_provider) {
        updateData.oauth_provider = 'google';
        updateData.oauth_id = googleUser.id;
      }

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT
    const token = authService.generateToken(user);

    // Always redirect to frontend with token for web requests
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&provider=google`);

  } catch (error) {
    logger.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
  }
},

  // GitHub OAuth - Initiate
  githubAuth: async (req, res) => {
    try {
      const { redirect_uri, state } = req.query;
      
      const authUrl = oauthService.getGitHubAuthUrl({
        redirectUri: redirect_uri,
        state: state
      });

      // For web: redirect to GitHub
      if (req.get('User-Agent')?.includes('Mozilla')) {
        return res.redirect(authUrl);
      }

      // For mobile: return the URL
      return res.json({
        success: true,
        data: { authUrl }
      });

    } catch (error) {
      logger.error('GitHub auth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate GitHub authentication',
        error: error.message
      });
    }
  },

  // GitHub OAuth - Callback
  githubCallback: async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn('GitHub OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authorization code missing')}`);
    }

    // Exchange code for tokens and user info
    const githubUser = await oauthService.getGitHubUserFromCode(code);

    // Find or create user
    let user = await User.findByEmail(githubUser.email);

    if (!user) {
      // Create new user with GitHub info
      user = await User.create({
        name: githubUser.name || githubUser.login,
        email: githubUser.email,
        password_hash: 'oauth_github', // Placeholder - won't be used
        role: 'student', // Default role
        profile_pic_url: githubUser.avatar_url,
        oauth_provider: 'github',
        oauth_id: githubUser.id.toString()
      });
    } else {
      // Update existing user with GitHub info if not already set
      const updateData = {};
      if (!user.profile_pic_url && githubUser.avatar_url) {
        updateData.profile_pic_url = githubUser.avatar_url;
      }
      if (!user.oauth_provider) {
        updateData.oauth_provider = 'github';
        updateData.oauth_id = githubUser.id.toString();
      }

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData);
      }
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT
    const token = authService.generateToken(user);

    // Always redirect to frontend with token for web requests
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&provider=github`);

  } catch (error) {
    logger.error('GitHub callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
  }
},

  // OAuth code exchange (for mobile apps that handle OAuth flow themselves)
  exchangeOAuthCode: async (req, res) => {
    try {
      const { code, provider, redirect_uri } = req.body;

      if (!code || !provider) {
        return res.status(400).json({
          success: false,
          message: 'Code and provider are required'
        });
      }

      let oauthUser;
      
      if (provider === 'google') {
        oauthUser = await oauthService.getGoogleUserFromCode(code, redirect_uri);
      } else if (provider === 'github') {
        oauthUser = await oauthService.getGitHubUserFromCode(code, redirect_uri);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported OAuth provider'
        });
      }

      // Find or create user (similar logic as above)
      let user = await User.findByEmail(oauthUser.email);

      if (!user) {
        const userData = {
          name: oauthUser.name || oauthUser.login,
          email: oauthUser.email,
          password_hash: `oauth_${provider}`,
          role: 'student',
          oauth_provider: provider,
          oauth_id: oauthUser.id.toString()
        };

        if (oauthUser.picture || oauthUser.avatar_url) {
          userData.profile_pic_url = oauthUser.picture || oauthUser.avatar_url;
        }
        if (oauthUser.email_verified) {
          userData.verified = true;
        }

        user = await User.create(userData);
      } else {
        // Update existing user
        const updateData = { last_login: new Date() };
        if (!user.profile_pic_url && (oauthUser.picture || oauthUser.avatar_url)) {
          updateData.profile_pic_url = oauthUser.picture || oauthUser.avatar_url;
        }
        if (!user.verified && oauthUser.email_verified) {
          updateData.verified = true;
        }
        if (!user.oauth_provider) {
          updateData.oauth_provider = provider;
          updateData.oauth_id = oauthUser.id.toString();
        }

        await user.update(updateData);
      }

      // Generate JWT
      const token = authService.generateToken(user);

      return res.json({
        success: true,
        message: `${provider} authentication successful`,
        data: {
          user: user.toJSON(),
          token
        }
      });

    } catch (error) {
      logger.error('OAuth code exchange error:', error);
      res.status(500).json({
        success: false,
        message: 'OAuth authentication failed',
        error: error.message
      });
    }
  }
};

module.exports = oauthController;