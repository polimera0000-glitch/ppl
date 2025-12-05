const { Coupon } = require('../models');
const { Op } = require('sequelize');

const couponController = {
  // Admin: Create a new coupon
  createCoupon: async (req, res) => {
    try {
      const { code, discount_percentage, valid_from, valid_until, usage_limit, is_active } = req.body;

      // Validate required fields
      if (!code || !discount_percentage) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code and discount percentage are required'
        });
      }

      // Validate discount percentage
      if (discount_percentage < 0 || discount_percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 0 and 100'
        });
      }

      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }

      // Create coupon
      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discount_percentage,
        valid_from: valid_from || null,
        valid_until: valid_until || null,
        usage_limit: usage_limit || null,
        is_active: is_active !== undefined ? is_active : true,
        created_by: req.user.id
      });

      return res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon
      });
    } catch (error) {
      console.error('Error creating coupon:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create coupon',
        error: error.message
      });
    }
  },

  // Admin: Get all coupons
  getAllCoupons: async (req, res) => {
    try {
      const { is_active, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      const { count, rows: coupons } = await Coupon.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch coupons',
        error: error.message
      });
    }
  },

  // Admin: Update a coupon
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const { discount_percentage, valid_from, valid_until, usage_limit, is_active } = req.body;

      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      // Validate discount percentage if provided
      if (discount_percentage !== undefined && (discount_percentage < 0 || discount_percentage > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Discount percentage must be between 0 and 100'
        });
      }

      // Update coupon
      await coupon.update({
        discount_percentage: discount_percentage !== undefined ? discount_percentage : coupon.discount_percentage,
        valid_from: valid_from !== undefined ? valid_from : coupon.valid_from,
        valid_until: valid_until !== undefined ? valid_until : coupon.valid_until,
        usage_limit: usage_limit !== undefined ? usage_limit : coupon.usage_limit,
        is_active: is_active !== undefined ? is_active : coupon.is_active
      });

      return res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon
      });
    } catch (error) {
      console.error('Error updating coupon:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update coupon',
        error: error.message
      });
    }
  },

  // Admin: Delete a coupon
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;

      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      await coupon.destroy();

      return res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete coupon',
        error: error.message
      });
    }
  },

  // User: Validate and get coupon details
  validateCoupon: async (req, res) => {
    try {
      const { code } = req.params;

      const coupon = await Coupon.findOne({
        where: { code: code.toUpperCase() }
      });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Invalid coupon code'
        });
      }

      // Check if coupon is active
      if (!coupon.is_active) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is no longer active'
        });
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is not yet valid'
        });
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has expired'
        });
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return res.status(400).json({
          success: false,
          message: 'This coupon has reached its usage limit'
        });
      }

      return res.json({
        success: true,
        message: 'Coupon is valid',
        data: {
          code: coupon.code,
          discount_percentage: coupon.discount_percentage
        }
      });
    } catch (error) {
      console.error('Error validating coupon:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate coupon',
        error: error.message
      });
    }
  }
};

module.exports = couponController;
