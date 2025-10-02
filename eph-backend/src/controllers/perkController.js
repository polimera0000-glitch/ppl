const { Perk, User, Sequelize } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const perkController = {
  // Get all perks with user context
  getAllPerks: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        featured,
        available_only = 'true',
        max_xp,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const userRole = req.user?.role || 'student';
      const userXP = req.user?.xp || 0;
      const userId = req.user?.id;

      // Build base where clause
      const whereClause = {
        is_active: true
      };

      // Add role filter if target_roles column exists
      if (Perk.rawAttributes && Perk.rawAttributes.target_roles) {
        whereClause.target_roles = { [Op.overlap]: [userRole] };
      }

      // Apply filters
      if (type) whereClause.type = type;
      if (category) whereClause.category = category;
      if (featured === 'true') whereClause.is_featured = true;
      if (max_xp) whereClause.xp_required = { [Op.lte]: parseInt(max_xp) };

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { category: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Availability filter
      if (available_only === 'true') {
        const now = new Date();
        const availabilityClauses = [
          {
            [Op.or]: [
              { valid_from: null },
              { valid_from: { [Op.lte]: now } }
            ]
          },
          {
            [Op.or]: [
              { valid_until: null },
              { valid_until: { [Op.gte]: now } }
            ]
          }
        ];

        // Check redemption limits if columns exist
        const hasRedemptionsCount = Perk.rawAttributes && Perk.rawAttributes.redemptions_count;
        const hasMaxRedemptions = Perk.rawAttributes && Perk.rawAttributes.max_redemptions;

        if (hasMaxRedemptions && hasRedemptionsCount) {
          availabilityClauses.push({
            [Op.or]: [
              { max_redemptions: null },
              Sequelize.literal(`("Perk"."redemptions_count" < "Perk"."max_redemptions")`)
            ]
          });
        }

        whereClause[Op.and] = availabilityClauses;
      }

      // Get user redemptions if logged in
      let userRedemptions = new Map();
      if (userId) {
        try {
          // Try to get user redemptions - handle case where UserPerk model might not exist
          const UserPerk = require('../models').UserPerk;
          if (UserPerk) {
            const redemptions = await UserPerk.findAll({
              where: { user_id: userId },
              attributes: ['perk_id', 'redeemed_at', 'redemption_data']
            });
            redemptions.forEach(r => userRedemptions.set(r.perk_id, r));
          }
        } catch (error) {
          logger.warn('UserPerk model not found, skipping redemption data');
        }
      }

      // Query perks
      const { rows: perks, count } = await Perk.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ['is_featured', 'DESC'],
          ['xp_required', 'ASC']
        ]
      });

      const totalPages = Math.ceil(count / limit);

      // Format perks with user context
      const formattedPerks = perks.map(perk => {
        const userRedemption = userRedemptions.get(perk.id);
        
        // Base perk data
        const perkData = {
          id: perk.id,
          title: perk.title,
          description: perk.description,
          xp_required: perk.xp_required || 0,
          type: perk.type,
          category: perk.category,
          value: perk.value,
          max_redemptions: perk.max_redemptions,
          redemptions_count: perk.redemptions_count || 0,
          sponsor_info: perk.sponsor_info,
          terms_conditions: perk.terms_conditions,
          image_url: perk.image_url,
          is_featured: perk.is_featured,
          is_active: perk.is_active,
          target_roles: perk.target_roles,
          remaining_redemptions: perk.max_redemptions 
            ? Math.max(0, perk.max_redemptions - (perk.redemptions_count || 0)) 
            : null,
          days_remaining: perk.valid_until 
            ? Math.ceil((new Date(perk.valid_until) - new Date()) / (1000 * 60 * 60 * 24)) 
            : null
        };

        // User-specific fields
        const isRedeemed = !!userRedemption;
        const canRedeem = req.user && !isRedeemed && 
          (typeof perk.canBeRedeemedBy === 'function' 
            ? perk.canBeRedeemedBy(req.user) 
            : (userXP >= (perk.xp_required || 0) && perk.is_active));
        
        const result = {
          ...perkData,
          can_redeem: canRedeem,
          xp_needed: req.user ? Math.max(0, (perk.xp_required || 0) - userXP) : (perk.xp_required || 0),
          is_redeemed: isRedeemed,
          redeemed_at: userRedemption?.redeemed_at
        };

        // Add redemption details if user has redeemed
        if (isRedeemed) {
          result.promo_code = perk.promo_code;
          result.external_url = perk.external_url;
          result.redemption_instructions = perk.redemption_instructions;
        }

        return result;
      });

      res.json({
        success: true,
        data: {
          perks: formattedPerks,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPerks: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get all perks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch perks',
        error: error.message
      });
    }
  },

  // Get single perk by ID
  getPerkById: async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user?.role || 'student';
      const userXP = req.user?.xp || 0;
      const userId = req.user?.id;

      const perk = await Perk.findByPk(id);

      if (!perk) {
        return res.status(404).json({
          success: false,
          message: 'Perk not found'
        });
      }

      // Check role access
      if (perk.target_roles && !perk.target_roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'This perk is not available for your role'
        });
      }

      // Check user redemption
      let userRedemption = null;
      if (userId) {
        try {
          const UserPerk = require('../models').UserPerk;
          if (UserPerk) {
            userRedemption = await UserPerk.findOne({
              where: { user_id: userId, perk_id: id },
              attributes: ['redeemed_at', 'redemption_data']
            });
          }
        } catch (error) {
          logger.warn('UserPerk model not found');
        }
      }

      const isRedeemed = !!userRedemption;
      const canRedeem = req.user && !isRedeemed &&
        (typeof perk.canBeRedeemedBy === 'function' 
          ? perk.canBeRedeemedBy(req.user) 
          : (userXP >= (perk.xp_required || 0) && perk.is_active));

      const result = {
        id: perk.id,
        title: perk.title,
        description: perk.description,
        xp_required: perk.xp_required || 0,
        type: perk.type,
        category: perk.category,
        value: perk.value,
        max_redemptions: perk.max_redemptions,
        redemptions_count: perk.redemptions_count || 0,
        sponsor_info: perk.sponsor_info,
        terms_conditions: perk.terms_conditions,
        image_url: perk.image_url,
        is_featured: perk.is_featured,
        is_active: perk.is_active,
        target_roles: perk.target_roles,
        can_redeem: canRedeem,
        xp_needed: req.user ? Math.max(0, (perk.xp_required || 0) - userXP) : (perk.xp_required || 0),
        is_redeemed: isRedeemed,
        redeemed_at: userRedemption?.redeemed_at
      };

      // Include redemption details if redeemed
      if (isRedeemed) {
        result.promo_code = perk.promo_code;
        result.external_url = perk.external_url;
        result.redemption_instructions = perk.redemption_instructions;
      }

      res.json({
        success: true,
        data: { perk: result }
      });

    } catch (error) {
      logger.error('Get perk by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch perk',
        error: error.message
      });
    }
  },

  // Redeem perk
  redeemPerk: async (req, res) => {
    let transaction;
    
    try {
      transaction = await Perk.sequelize.transaction();
      
      const { id } = req.params;
      const userId = req.user.id;

      const perk = await Perk.findByPk(id, { transaction });
      if (!perk) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Perk not found'
        });
      }

      const user = await User.findByPk(userId, { transaction });

      // Validate redemption eligibility
      const canRedeem = typeof perk.canBeRedeemedBy === 'function' 
        ? perk.canBeRedeemedBy(user)
        : (
            perk.is_active && 
            (user.xp || 0) >= (perk.xp_required || 0) &&
            (!perk.target_roles || perk.target_roles.includes(user.role))
          );

      if (!canRedeem) {
        await transaction.rollback();
        const reasons = [];
        if ((user.xp || 0) < (perk.xp_required || 0)) {
          reasons.push(`Need ${(perk.xp_required || 0) - (user.xp || 0)} more XP`);
        }
        if (perk.target_roles && !perk.target_roles.includes(user.role)) {
          reasons.push('Not available for your role');
        }
        if (!perk.is_active) {
          reasons.push('Perk is not currently available');
        }

        return res.status(400).json({
          success: false,
          message: 'Cannot redeem this perk',
          reasons
        });
      }

      // Check for existing redemption
      let UserPerk;
      try {
        UserPerk = require('../models').UserPerk;
      } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          message: 'Redemption system not available'
        });
      }

      const existingRedemption = await UserPerk.findOne({
        where: { user_id: userId, perk_id: id },
        transaction
      });

      if (existingRedemption) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'You have already redeemed this perk'
        });
      }

      // Create redemption record
      const redemptionData = {
        title: perk.title,
        promo_code: perk.promo_code,
        external_url: perk.external_url,
        redemption_instructions: perk.redemption_instructions,
        terms_conditions: perk.terms_conditions
      };

      const userPerk = await UserPerk.create({
        user_id: userId,
        perk_id: id,
        redemption_data: redemptionData
      }, { transaction });

      // Increment redemption count
      await perk.increment('redemptions_count', { by: 1, transaction });
      await perk.reload({ transaction });

      await transaction.commit();

      // Send email notification
      try {
        await emailService.sendPerkRedemptionEmail(
          user.email,
          user.name,
          perk.title,
          {
            redemptionCode: perk.promo_code,
            redemptionUrl: perk.external_url,
            instructions: perk.redemption_instructions,
            termsConditions: perk.terms_conditions
          }
        );
      } catch (emailError) {
        logger.error('Failed to send redemption email:', emailError);
      }

      res.json({
        success: true,
        message: 'Perk redeemed successfully',
        data: {
          redemption: {
            perk_id: perk.id,
            perk_title: perk.title,
            redeemed_at: userPerk.redeemed_at || new Date(),
            promo_code: perk.promo_code,
            external_url: perk.external_url,
            redemption_instructions: perk.redemption_instructions,
            terms_conditions: perk.terms_conditions
          }
        }
      });

    } catch (error) {
      if (transaction) await transaction.rollback();
      logger.error('Redeem perk error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to redeem perk',
        error: error.message
      });
    }
  },

  // Get user's redeemed perks
  getUserRedeemedPerks: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let UserPerk;
      try {
        UserPerk = require('../models').UserPerk;
      } catch (error) {
        return res.json({
          success: true,
          data: {
            redeemedPerks: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalRedeemed: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }

      const { rows: redemptions, count } = await UserPerk.findAndCountAll({
        where: { user_id: userId },
        include: [{
          model: Perk,
          as: 'perk',
          required: true
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['redeemed_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      const formattedRedemptions = redemptions.map(redemption => ({
        id: redemption.id,
        perk: {
          ...redemption.perk.toJSON(),
          is_redeemed: true,
          promo_code: redemption.perk.promo_code,
          external_url: redemption.perk.external_url,
          redemption_instructions: redemption.perk.redemption_instructions,
          terms_conditions: redemption.perk.terms_conditions
        },
        redeemed_at: redemption.redeemed_at,
        redemption_data: redemption.redemption_data
      }));

      res.json({
        success: true,
        data: {
          redeemedPerks: formattedRedemptions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRedeemed: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get user redeemed perks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch redeemed perks',
        error: error.message
      });
    }
  },

  // Get available perks for user
  getAvailablePerks: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get redeemed perk IDs
      let redeemedPerkIds = [];
      try {
        const UserPerk = require('../models').UserPerk;
        const redemptions = await UserPerk.findAll({
          where: { user_id: userId },
          attributes: ['perk_id']
        });
        redeemedPerkIds = redemptions.map(r => r.perk_id);
      } catch (error) {
        logger.warn('UserPerk model not found, showing all perks');
      }

      const whereClause = {
        is_active: true,
        xp_required: { [Op.lte]: user.xp || 0 }
      };

      if (redeemedPerkIds.length > 0) {
        whereClause.id = { [Op.notIn]: redeemedPerkIds };
      }

      if (Perk.rawAttributes && Perk.rawAttributes.target_roles) {
        whereClause.target_roles = { [Op.overlap]: [user.role] };
      }

      const availablePerks = await Perk.findAll({
        where: whereClause,
        limit: parseInt(limit),
        order: [['xp_required', 'ASC'], ['created_at', 'DESC']]
      });

      const formattedPerks = availablePerks.map(perk => ({
        ...perk.toJSON(),
        can_redeem: true,
        xp_needed: 0,
        is_redeemed: false
      }));

      res.json({
        success: true,
        data: {
          availablePerks: formattedPerks,
          totalAvailable: availablePerks.length,
          userXP: user.xp
        }
      });

    } catch (error) {
      logger.error('Get available perks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available perks',
        error: error.message
      });
    }
  },

  // Get featured perks
  getFeaturedPerks: async (req, res) => {
    try {
      const userRole = req.user?.role || 'student';
      const userXP = req.user?.xp || 0;
      const userId = req.user?.id;

      const whereClause = { 
        is_active: true, 
        is_featured: true 
      };
      
      if (Perk.rawAttributes && Perk.rawAttributes.target_roles) {
        whereClause.target_roles = { [Op.overlap]: [userRole] };
      }

      const featuredPerks = await Perk.findAll({
        where: whereClause,
        order: [['xp_required', 'ASC']]
      });

      // Get user redemptions
      let userRedemptions = new Map();
      if (userId) {
        try {
          const UserPerk = require('../models').UserPerk;
          const redemptions = await UserPerk.findAll({
            where: { 
              user_id: userId,
              perk_id: { [Op.in]: featuredPerks.map(p => p.id) }
            },
            attributes: ['perk_id', 'redeemed_at']
          });
          redemptions.forEach(r => userRedemptions.set(r.perk_id, r));
        } catch (error) {
          logger.warn('UserPerk model not found');
        }
      }

      const formattedPerks = featuredPerks.map(perk => {
        const userRedemption = userRedemptions.get(perk.id);
        const isRedeemed = !!userRedemption;
        
        const result = {
          ...perk.toJSON(),
          can_redeem: req.user && !isRedeemed &&
            (typeof perk.canBeRedeemedBy === 'function' 
              ? perk.canBeRedeemedBy(req.user) 
              : (userXP >= (perk.xp_required || 0))),
          xp_needed: req.user ? Math.max(0, (perk.xp_required || 0) - userXP) : (perk.xp_required || 0),
          is_redeemed: isRedeemed,
          redeemed_at: userRedemption?.redeemed_at
        };

        if (isRedeemed) {
          result.promo_code = perk.promo_code;
          result.external_url = perk.external_url;
          result.redemption_instructions = perk.redemption_instructions;
        }

        return result;
      });

      res.json({
        success: true,
        data: { featuredPerks: formattedPerks }
      });

    } catch (error) {
      logger.error('Get featured perks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured perks',
        error: error.message
      });
    }
  },

  // Get perks by category
  getPerksByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const userRole = req.user?.role || 'student';
      const userXP = req.user?.xp || 0;
      const userId = req.user?.id;

      const whereClause = {
        is_active: true,
        category: { [Op.iLike]: `%${category}%` }
      };

      if (Perk.rawAttributes && Perk.rawAttributes.target_roles) {
        whereClause.target_roles = { [Op.overlap]: [userRole] };
      }

      const perks = await Perk.findAll({
        where: whereClause,
        order: [['xp_required', 'ASC'], ['created_at', 'DESC']]
      });

      // Get user redemptions
      let userRedemptions = new Map();
      if (userId) {
        try {
          const UserPerk = require('../models').UserPerk;
          const redemptions = await UserPerk.findAll({
            where: { 
              user_id: userId,
              perk_id: { [Op.in]: perks.map(p => p.id) }
            },
            attributes: ['perk_id', 'redeemed_at']
          });
          redemptions.forEach(r => userRedemptions.set(r.perk_id, r));
        } catch (error) {
          logger.warn('UserPerk model not found');
        }
      }

      const formattedPerks = perks.map(perk => {
        const userRedemption = userRedemptions.get(perk.id);
        const isRedeemed = !!userRedemption;
        
        const result = {
          ...perk.toJSON(),
          can_redeem: req.user && !isRedeemed &&
            (typeof perk.canBeRedeemedBy === 'function' 
              ? perk.canBeRedeemedBy(req.user) 
              : (userXP >= (perk.xp_required || 0))),
          xp_needed: req.user ? Math.max(0, (perk.xp_required || 0) - userXP) : (perk.xp_required || 0),
          is_redeemed: isRedeemed,
          redeemed_at: userRedemption?.redeemed_at
        };

        if (isRedeemed) {
          result.promo_code = perk.promo_code;
          result.external_url = perk.external_url;
          result.redemption_instructions = perk.redemption_instructions;
        }

        return result;
      });

      res.json({
        success: true,
        data: {
          category,
          perks: formattedPerks
        }
      });

    } catch (error) {
      logger.error('Get perks by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch perks by category',
        error: error.message
      });
    }
  },

  // Admin: Create perk
  createPerk: async (req, res) => {
    try {
      const perkData = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        category: req.body.category,
        xp_required: req.body.xp_required || 0,
        value: req.body.value,
        max_redemptions: req.body.max_redemptions,
        sponsor_info: req.body.sponsor_info || {},
        terms_conditions: req.body.terms_conditions,
        redemption_instructions: req.body.redemption_instructions,
        image_url: req.body.image_url,
        external_url: req.body.external_url,
        promo_code: req.body.promo_code,
        valid_from: req.body.valid_from,
        valid_until: req.body.valid_until,
        target_roles: req.body.target_roles || ['student'],
        is_featured: req.body.is_featured || false,
        created_by: req.user?.id
      };

      const perk = await Perk.create(perkData);

      res.status(201).json({
        success: true,
        message: 'Perk created successfully',
        data: { perk: perk.toJSON() }
      });

    } catch (error) {
      logger.error('Create perk error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create perk',
        error: error.message
      });
    }
  },

  // Admin: Update perk
  updatePerk: async (req, res) => {
    try {
      const { id } = req.params;
      const perk = await Perk.findByPk(id);
      
      if (!perk) {
        return res.status(404).json({
          success: false,
          message: 'Perk not found'
        });
      }

      await perk.update(req.body);

      res.json({
        success: true,
        message: 'Perk updated successfully',
        data: { perk: perk.toJSON() }
      });

    } catch (error) {
      logger.error('Update perk error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update perk',
        error: error.message
      });
    }
  },

  // Admin: Delete perk
  deletePerk: async (req, res) => {
    try {
      const { id } = req.params;
      const perk = await Perk.findByPk(id);
      
      if (!perk) {
        return res.status(404).json({
          success: false,
          message: 'Perk not found'
        });
      }

      // Check if perk has redemptions
      try {
        const UserPerk = require('../models').UserPerk;
        const redemptionCount = await UserPerk.count({ where: { perk_id: id } });
        if (redemptionCount > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete perk that has been redeemed. Consider deactivating instead.'
          });
        }
      } catch (error) {
        logger.warn('UserPerk model not found, proceeding with deletion');
      }

      await perk.destroy();

      res.json({
        success: true,
        message: 'Perk deleted successfully'
      });

    } catch (error) {
      logger.error('Delete perk error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete perk',
        error: error.message
      });
    }
  },

  // Admin: Toggle featured status
  togglePerkFeatured: async (req, res) => {
    try {
      const { id } = req.params;
      const { featured = true } = req.body;

      const perk = await Perk.findByPk(id);
      if (!perk) {
        return res.status(404).json({
          success: false,
          message: 'Perk not found'
        });
      }

      await perk.update({ is_featured: featured });

      res.json({
        success: true,
        message: `Perk ${featured ? 'featured' : 'unfeatured'} successfully`,
        data: { perk: perk.toJSON() }
      });

    } catch (error) {
      logger.error('Toggle perk featured error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle perk featured status',
        error: error.message
      });
    }
  },

  // Admin: Get perk statistics
  getPerkStats: async (req, res) => {
    try {
      const totalPerks = await Perk.count({ where: { is_active: true } });
      const featuredPerks = await Perk.count({ where: { is_active: true, is_featured: true } });
      
      let totalRedemptions = 0;
      let topRedeemedPerks = [];
      
      try {
        const UserPerk = require('../models').UserPerk;
        totalRedemptions = await UserPerk.count();
        
        // Get top redeemed perks with actual redemption counts
        const perkRedemptions = await UserPerk.findAll({
          attributes: [
            'perk_id',
            [Sequelize.fn('COUNT', Sequelize.col('perk_id')), 'redemption_count']
          ],
          group: ['perk_id'],
          order: [[Sequelize.literal('redemption_count'), 'DESC']],
          limit: 10,
          include: [{
            model: Perk,
            as: 'perk',
            attributes: ['id', 'title', 'type', 'max_redemptions']
          }]
        });

        topRedeemedPerks = perkRedemptions.map(pr => ({
          id: pr.perk.id,
          title: pr.perk.title,
          type: pr.perk.type,
          actual_redemptions: parseInt(pr.get('redemption_count')),
          max_redemptions: pr.perk.max_redemptions
        }));
        
      } catch (error) {
        logger.warn('UserPerk model not found, redemption stats unavailable');
      }

      const upcomingPerks = await Perk.count({
        where: {
          is_active: true,
          valid_from: { [Op.gt]: new Date() }
        }
      });

      const expiringPerks = await Perk.count({
        where: {
          is_active: true,
          valid_until: {
            [Op.and]: [
              { [Op.ne]: null },
              { [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Within 7 days
              { [Op.gt]: new Date() }
            ]
          }
        }
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalPerks,
            totalRedemptions,
            featuredPerks,
            upcomingPerks,
            expiringPerks
          },
          topRedeemedPerks
        }
      });

    } catch (error) {
      logger.error('Get perk stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch perk statistics',
        error: error.message
      });
    }
  },

  // Admin: Get perk redemption history
  getPerkRedemptions: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const perk = await Perk.findByPk(id);
      if (!perk) {
        return res.status(404).json({
          success: false,
          message: 'Perk not found'
        });
      }

      let UserPerk;
      try {
        UserPerk = require('../models').UserPerk;
      } catch (error) {
        return res.json({
          success: true,
          data: {
            perk: { id: perk.id, title: perk.title },
            redemptions: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalRedemptions: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }

      const offset = (page - 1) * limit;

      const { rows: redemptions, count } = await UserPerk.findAndCountAll({
        where: { perk_id: id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'college', 'xp']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['redeemed_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          perk: {
            id: perk.id,
            title: perk.title
          },
          redemptions: redemptions.map(redemption => ({
            user: {
              id: redemption.user.id,
              name: redemption.user.name,
              email: redemption.user.email,
              college: redemption.user.college,
              xp: redemption.user.xp
            },
            redeemed_at: redemption.redeemed_at,
            redemption_data: redemption.redemption_data
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRedemptions: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get perk redemptions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch perk redemptions',
        error: error.message
      });
    }
  }
};

module.exports = perkController;