const express = require('express');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./auth');
const userRoutes = require('./user');
const competitionRoutes = require('./competitions');
const registrationRoutes = require('./registrations');
const videoRoutes = require('./videos');
const perkRoutes = require('./perks');
const adminRoutes = require('./admin');
const submissions = require('./submissions');

const router = express.Router();

// Admin-specific rate limiting (stricter than general API)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Lower limit for admin actions
  message: {
    error: 'Too many admin requests from this IP, please try again later.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/competitions', competitionRoutes);
router.use('/submissions', submissions);
router.use('/registrations', registrationRoutes);
router.use('/videos', videoRoutes);
router.use('/perks', perkRoutes);

// Admin routes with stricter rate limiting
router.use('/admin', adminLimiter, adminRoutes);

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'EPH Platform API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        adminMagicLink: 'POST /auth/admin-magic-link',
        consumeMagic: 'POST /auth/consume-magic',
        profile: 'GET /auth/profile',
        updateProfile: 'PUT /auth/profile',
        changePassword: 'POST /auth/change-password',
        forgotPassword: 'POST /auth/forgot-password',
        resetPassword: 'POST /auth/reset-password',
        logout: 'POST /auth/logout'
      },
      admin: {
        inviteAdmin: 'POST /admin/invite',
        listAdmins: 'GET /admin/list',
        deactivateAdmin: 'DELETE /admin/:adminId/deactivate'
      },
      users: {
        list: 'GET /users',
        profile: 'GET /users/:id',
        stats: 'GET /users/:id/stats',
        badges: 'GET /users/:id/badges',
        leaderboard: 'GET /users/leaderboard',
        byCollege: 'GET /users/college/:college',
        addXP: 'POST /users/:id/xp (admin)',
        updateRole: 'PUT /users/:id/role (admin)',
        verify: 'PUT /users/:id/verify (admin)',
        deactivate: 'PUT /users/:id/deactivate (admin)',
        reactivate: 'PUT /users/:id/reactivate (admin)'
      },
      competitions: {
        list: 'GET /competitions',
        details: 'GET /competitions/:id',
        create: 'POST /competitions (admin)',
        update: 'PUT /competitions/:id (admin)',
        delete: 'DELETE /competitions/:id (admin)',
        register: 'POST /competitions/:id/register',
        myRegistrations: 'GET /competitions/my/registrations',
        cancelRegistration: 'DELETE /competitions/registrations/:registrationId',
        viewRegistrations: 'GET /competitions/:id/registrations (admin/hiring/investor)'
      },
      registrations: {
        list: 'GET /registrations (admin/hiring/investor)',
        details: 'GET /registrations/:id',
        updateStatus: 'PUT /registrations/:id/status (admin)',
        updateScore: 'PUT /registrations/:id/score (admin)',
        submitProject: 'POST /registrations/:id/submit',
        addTeamMember: 'POST /registrations/:id/members',
        removeTeamMember: 'DELETE /registrations/:id/members/:memberId',
        leaderboard: 'GET /registrations/competition/:competitionId/leaderboard'
      },
      videos: {
        feed: 'GET /videos/feed',
        details: 'GET /videos/:id',
        upload: 'POST /videos (multipart/form-data)',
        update: 'PUT /videos/:id',
        delete: 'DELETE /videos/:id',
        like: 'POST /videos/:id/like',
        userVideos: 'GET /videos/user/:userId',
        analytics: 'GET /videos/:id/analytics',
        feature: 'PUT /videos/:id/feature (admin)',
        stats: 'GET /videos/admin/stats (admin)'
      },
      perks: {
        list: 'GET /perks',
        details: 'GET /perks/:id',
        featured: 'GET /perks/featured',
        byCategory: 'GET /perks/category/:category',
        redeem: 'POST /perks/:id/redeem',
        myRedeemed: 'GET /perks/my/redeemed',
        myAvailable: 'GET /perks/my/available',
        create: 'POST /perks (admin)',
        update: 'PUT /perks/:id (admin)',
        delete: 'DELETE /perks/:id (admin)',
        feature: 'PUT /perks/:id/feature (admin)',
        stats: 'GET /perks/admin/stats (admin)',
        redemptions: 'GET /perks/:id/redemptions (admin)'
      }
    },
    security: {
      rateLimiting: {
        general: '100 requests per 15 minutes',
        admin: '20 requests per 15 minutes'
      },
      authentication: 'JWT Bearer tokens required for protected routes',
      adminAccess: 'Admin role required for /admin endpoints'
    }
  });
});

module.exports = router;