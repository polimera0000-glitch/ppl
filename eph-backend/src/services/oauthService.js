// services/oauthService.js
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class OAuthService {
  constructor() {
    // Google OAuth config
    this.google = {
      clientId: process.env.GOOGLE_CLIENT_ID || config.oauth?.google?.clientId,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || config.oauth?.google?.clientSecret,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || config.oauth?.google?.redirectUri,
      scope: 'openid email profile',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
    };

    // GitHub OAuth config
    this.github = {
      clientId: process.env.GITHUB_CLIENT_ID || config.oauth?.github?.clientId,
      clientSecret: process.env.GITHUB_CLIENT_SECRET || config.oauth?.github?.clientSecret,
      redirectUri: process.env.GITHUB_REDIRECT_URI || config.oauth?.github?.redirectUri,
      scope: 'user:email',
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      userEmailUrl: 'https://api.github.com/user/emails'
    };
  }

  // Generate Google OAuth URL
  getGoogleAuthUrl({ redirectUri, state } = {}) {
    if (!this.google.clientId) {
      throw new Error('Google OAuth client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.google.clientId,
      redirect_uri: redirectUri || this.google.redirectUri,
      scope: this.google.scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'select_account'
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.google.authUrl}?${params.toString()}`;
  }

  // Generate GitHub OAuth URL
  getGitHubAuthUrl({ redirectUri, state } = {}) {
    if (!this.github.clientId) {
      throw new Error('GitHub OAuth client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.github.clientId,
      redirect_uri: redirectUri || this.github.redirectUri,
      scope: this.github.scope,
      response_type: 'code'
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.github.authUrl}?${params.toString()}`;
  }

  // Exchange Google code for user info
  async getGoogleUserFromCode(code, redirectUri = null) {
    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await axios.post(this.google.tokenUrl, {
        client_id: this.google.clientId,
        client_secret: this.google.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || this.google.redirectUri
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const { access_token } = tokenResponse.data;
      if (!access_token) {
        throw new Error('No access token received from Google');
      }

      // Step 2: Get user info using access token
      const userResponse = await axios.get(this.google.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      const userData = userResponse.data;
      
      // Normalize user data
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        email_verified: userData.verified_email || false
      };

    } catch (error) {
      logger.error('Google OAuth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Google: ' + (error.response?.data?.error_description || error.message));
    }
  }

  // Exchange GitHub code for user info
  async getGitHubUserFromCode(code, redirectUri = null) {
    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await axios.post(this.github.tokenUrl, {
        client_id: this.github.clientId,
        client_secret: this.github.clientSecret,
        code,
        redirect_uri: redirectUri || this.github.redirectUri
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const { access_token } = tokenResponse.data;
      if (!access_token) {
        throw new Error('No access token received from GitHub');
      }

      // Step 2: Get user info
      const userResponse = await axios.get(this.github.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'EPH-Backend'
        }
      });

      const userData = userResponse.data;

      // Step 3: Get user email (GitHub may not return email in user info)
      let email = userData.email;
      if (!email) {
        try {
          const emailResponse = await axios.get(this.github.userEmailUrl, {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'User-Agent': 'EPH-Backend'
            }
          });

          // Find primary email
          const emails = emailResponse.data;
          const primaryEmail = emails.find(e => e.primary && e.verified);
          email = primaryEmail ? primaryEmail.email : emails[0]?.email;
        } catch (emailError) {
          logger.warn('Failed to get GitHub user email:', emailError.message);
        }
      }

      if (!email) {
        throw new Error('Could not retrieve email from GitHub account');
      }

      // Normalize user data
      return {
        id: userData.id,
        login: userData.login,
        email: email,
        name: userData.name,
        avatar_url: userData.avatar_url,
        email_verified: true // GitHub emails are generally verified
      };

    } catch (error) {
      logger.error('GitHub OAuth error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with GitHub: ' + (error.response?.data?.message || error.message));
    }
  }

  // Verify OAuth configuration
  validateConfig() {
    const errors = [];

    if (!this.google.clientId) errors.push('GOOGLE_CLIENT_ID not configured');
    if (!this.google.clientSecret) errors.push('GOOGLE_CLIENT_SECRET not configured');
    if (!this.google.redirectUri) errors.push('GOOGLE_REDIRECT_URI not configured');

    if (!this.github.clientId) errors.push('GITHUB_CLIENT_ID not configured');
    if (!this.github.clientSecret) errors.push('GITHUB_CLIENT_SECRET not configured');
    if (!this.github.redirectUri) errors.push('GITHUB_REDIRECT_URI not configured');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new OAuthService();