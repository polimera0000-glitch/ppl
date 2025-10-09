const { User, Video, Registration } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

const userController = {

 // --- SINGLE email existence check (no verified/is_active filtering) ---
  existsByEmail: async (req, res) => {
    try {
      const email = normalizeEmail(req.query.email);
      if (!email) {
        return res.json({ success: true, data: { exists: false } });
      }
      const user = await User.findOne({
        where: { email }, 
        attributes: ['id'],
      });
      return res.json({ success: true, data: { exists: !!user } });
    } catch (error) {
      logger.error('existsByEmail error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user',
        error: error.message,
      });
    }
  },

  // --- BULK email existence check (no verified/is_active filtering) ---
  existsBulk: async (req, res) => {
    try {
      const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];
      const normalized = emails.map(normalizeEmail).filter(Boolean);
      if (!normalized.length) {
        return res.json({ success: true, data: { exists: {}, missing: [] } });
      }
      const users = await User.findAll({
        where: { email: { [Op.in]: normalized } },  // <— no verified/is_active condition
        attributes: ['email'],
      });
      const found = new Set(users.map(u => u.email.toLowerCase()));
      const exists = Object.fromEntries(normalized.map(e => [e, found.has(e)]));
      const missing = normalized.filter(e => !found.has(e));
      return res.json({ success: true, data: { exists, missing } });
    } catch (error) {
      logger.error('existsBulk error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check users',
        error: error.message,
      });
    }
  },
  // Get all users (with pagination and filters)
getAllUsers: async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      college,
      branch,
      verified,
      search,
      phone,
      org,
      country,
      // NEW filters:
      gender,               // 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
      edu_type,             // 'undergraduate' | 'graduate' | 'other'
      min_work_exp,         // number
      max_work_exp          // number
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { is_active: true };

    // filters
    if (role) whereClause.role = role;
    if (college) whereClause.college = { [Op.iLike]: `%${college}%` };
    if (branch) whereClause.branch = { [Op.iLike]: `%${branch}%` };
    if (verified !== undefined) whereClause.verified = verified === 'true';
    if (phone) whereClause.phone = { [Op.iLike]: `%${phone}%` };
    if (org) whereClause.org = { [Op.iLike]: `%${org}%` };
    if (country) whereClause.country = { [Op.iLike]: `%${country}%` };

    // NEW: extra filters
    if (gender) whereClause.gender = gender;
    if (edu_type) whereClause.edu_type = edu_type;

    if (min_work_exp !== undefined || max_work_exp !== undefined) {
      const range = {};
      if (min_work_exp !== undefined) range[Op.gte] = Number(min_work_exp);
      if (max_work_exp !== undefined) range[Op.lte] = Number(max_work_exp);
      whereClause.work_experience_years = range;
    }

    // search across common text fields
    if (search) {
      whereClause[Op.or] = [
        { name:    { [Op.iLike]: `%${search}%` } },
        { email:   { [Op.iLike]: `%${search}%` } },
        { college: { [Op.iLike]: `%${search}%` } },
        { phone:   { [Op.iLike]: `%${search}%` } },
        { org:     { [Op.iLike]: `%${search}%` } },
        { country: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: [
        'id','name','email','role',
        'college','branch','year','skills',
        'phone','org','country',
        'profile_pic_url','xp','badges',
        'verified','created_at',
        // NEW:
        'gender','edu_type','work_experience_years','agreed_tnc_at','agreed_privacy_at'
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
},

  // Get user by ID
  getUserById: async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { id, is_active: true },
      attributes: {
        exclude: ['password_hash'] // keep it safe; your toJSON also strips it
      },
      include: [
        {
          model: Video,
          as: 'videos',
          where: {
            visibility_roles: { [Op.overlap]: [req.user?.role || 'public'] }
          },
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']]
        },
        {
          model: Registration,
          as: 'ledRegistrations',
          required: false,
          limit: 5,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user: user.toJSON() } });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
},


  // Get user statistics
  getUserStats: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get user statistics
      const videosCount = await Video.count({
        where: { uploader_id: id }
      });

      const registrationsCount = await Registration.count({
        where: { leader_id: id }
      });

      const stats = {
        totalVideos: videosCount,
        totalRegistrations: registrationsCount,
        totalXP: user.xp,
        totalBadges: user.badges.length,
        joinDate: user.created_at,
        lastActive: user.last_login
      };

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics',
        error: error.message
      });
    }
  },

  // Get leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const { limit = 50, college, role } = req.query;

      const whereClause = { is_active: true };
      if (college) whereClause.college = { [Op.iLike]: `%${college}%` };
      if (role) whereClause.role = role;

      const users = await User.findAll({
        where: whereClause,
        order: [['xp', 'DESC']],
        limit: parseInt(limit),
        attributes: [
          'id', 'name', 'college', 'branch', 'role', 
          'xp', 'badges', 'profile_pic_url'
        ]
      });

      // Add rank to each user
      const leaderboard = users.map((user, index) => ({
        ...user.toJSON(),
        rank: index + 1
      }));

      res.json({
        success: true,
        data: {
          leaderboard,
          total: users.length
        }
      });

    } catch (error) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leaderboard',
        error: error.message
      });
    }
  },

  // Add XP to user (admin only)
  addUserXP: async (req, res) => {
    try {
      const { id } = req.params;
      const { points, reason = 'Manual addition' } = req.body;

      if (!points || points <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a positive number'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const newBadges = await user.addXP(points, reason);

      res.json({
        success: true,
        message: `${points} XP added successfully`,
        data: {
          user: user.toJSON(),
          newBadges
        }
      });

    } catch (error) {
      logger.error('Add user XP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add XP',
        error: error.message
      });
    }
  },

  // Update user role (admin only)
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const validRoles = ['student', 'hiring', 'investor', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ role });

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: error.message
      });
    }
  },

  // Verify user (admin only)
  verifyUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { verified = true } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ verified });

      res.json({
        success: true,
        message: `User ${verified ? 'verified' : 'unverified'} successfully`,
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      logger.error('Verify user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user verification',
        error: error.message
      });
    }
  },

  // Deactivate user (admin only)
  deactivateUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deactivating themselves
      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ is_active: false });

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });

    } catch (error) {
      logger.error('Deactivate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate user',
        error: error.message
      });
    }
  },

  // Reactivate user (admin only)
  reactivateUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.update({ is_active: true });

      res.json({
        success: true,
        message: 'User reactivated successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      logger.error('Reactivate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reactivate user',
        error: error.message
      });
    }
  },

  // Get users by college
  getUsersByCollege: async (req, res) => {
    try {
      const { college } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const { rows: users, count } = await User.findAndCountAll({
        where: {
          college: { [Op.iLike]: `%${college}%` },
          is_active: true
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['xp', 'DESC']],
        attributes: [
          'id', 'name', 'email', 'branch', 'year', 
          'skills', 'profile_pic_url', 'xp', 'badges'
        ]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          users,
          college,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalUsers: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get users by college error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users by college',
        error: error.message
      });
    }
  },

  // Get user badges and achievements
  getUserBadges: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const badgeDetails = {
        ROOKIE: { name: 'Rookie', description: 'Earned 100 XP', xp_required: 100 },
        EXPLORER: { name: 'Explorer', description: 'Earned 500 XP', xp_required: 500 },
        ACHIEVER: { name: 'Achiever', description: 'Earned 1000 XP', xp_required: 1000 },
        MASTER: { name: 'Master', description: 'Earned 2500 XP', xp_required: 2500 }
      };

      const userBadges = user.badges.map(badge => ({
        badge,
        ...badgeDetails[badge],
        earned_at: user.updated_at // Could be improved with badge timestamp
      }));

      res.json({
        success: true,
        data: {
          badges: userBadges,
          totalBadges: userBadges.length,
          currentXP: user.xp
        }
      });

    } catch (error) {
      logger.error('Get user badges error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user badges',
        error: error.message
      });
    }
  },

  // ✅ NEW: Hard delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (String(id) === String(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Optional safety: avoid deleting the last admin
      if (user.role === 'admin') {
        const otherAdmins = await User.count({
          where: { role: 'admin', id: { [Op.ne]: id }, is_active: true }
        });
        if (otherAdmins === 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete the last active admin'
          });
        }
      }

      await user.destroy(); // hard delete; switch to soft-delete if needed
      return res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  },
};

module.exports = userController;