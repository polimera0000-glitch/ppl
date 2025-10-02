// controllers/adminController.js
const { User } = require('../models');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const config = require('../config');
const crypto = require('crypto');

const adminController = {
  // Only existing admins can invite new admins
  inviteAdmin: async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can invite other admins' });
    }

    const { email, name, phone, org, country } = req.body; // NEW optional fields

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const tempPassword = generateReadablePassword();

    const adminUser = await User.create({
      name,
      email,
      password_hash: tempPassword,    // hashed by hook
      role: 'admin',
      is_active: true,
      verified: true,
      force_password_change: true,
      phone: phone || null,           // NEW
      org: org || null,               // NEW
      country: country || null        // NEW
    });

    logger.info('Admin invited another admin', {
      invitedBy: req.user.email,
      invitedEmail: email,
      invitedName: name
    });

    await emailService.sendAdminInvitationEmail(email, name, {
      tempPassword,
      invitedBy: req.user.name,
      loginUrl: `${config.frontend?.baseUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
    });

    res.status(201).json({
      success: true,
      message: 'Admin invitation sent successfully',
      data: {
        admin: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          phone: adminUser.phone,       // NEW
          org: adminUser.org,           // NEW
          country: adminUser.country,   // NEW
          created_at: adminUser.created_at
        }
      }
    });

  } catch (error) {
    logger.error('Admin invitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to send admin invitation', error: error.message });
  }
},


  // Get list of all admins (admin only)
  getAdmins: async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const admins = await User.findAll({
      where: { role: 'admin', is_active: true },
      attributes: ['id','name','email','phone','org','country','last_login','created_at'], // NEW fields included
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: { admins } });
  } catch (error) {
    logger.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins', error: error.message });
  }
},


  // Deactivate admin (admin only, cannot deactivate self)
  deactivateAdmin: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { adminId } = req.params;

      if (adminId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      const admin = await User.findByPk(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      await admin.update({ is_active: false });

      logger.info('Admin deactivated', { 
        deactivatedBy: req.user.email, 
        deactivatedAdmin: admin.email 
      });

      res.json({
        success: true,
        message: 'Admin deactivated successfully'
      });

    } catch (error) {
      logger.error('Admin deactivation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate admin',
        error: error.message
      });
    }
  }
};

// Helper function to generate readable temporary password
function generateReadablePassword(length = 8) {
  // Use mix of uppercase, lowercase, numbers but avoid confusing characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = adminController;