// src/controllers/paymentController.js
const { Payment, Registration, Competition, User } = require('../models');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const paymentController = {
  // Create payment order for registration
  createPaymentOrder: async (req, res) => {
    try {
      const { competitionId, userType, teamSize = 1, teamName } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!competitionId || !userType) {
        return res.status(400).json({
          success: false,
          message: 'Competition ID and user type are required'
        });
      }

      if (!['undergraduate', 'graduate'].includes(userType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'User type must be undergraduate or graduate'
        });
      }

      // Check if competition exists
      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Check if user already has a pending/completed payment for this competition
      const existingPayment = await Payment.findOne({
        where: {
          user_id: userId,
          competition_id: competitionId,
          status: ['pending', 'processing', 'completed']
        }
      });

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: 'Payment already exists for this competition',
          data: {
            orderId: existingPayment.order_id,
            status: existingPayment.status
          }
        });
      }

      // Get user details
      const user = await User.findByPk(userId);

      // Create payment order
      const paymentOrderData = {
        competitionId,
        userId,
        userType: userType.toLowerCase(),
        teamSize: parseInt(teamSize),
        teamName,
        userEmail: user.email,
        userName: user.name
      };

      const paymentOrder = await paymentService.createPaymentOrder(paymentOrderData);

      // Save payment record to database
      const payment = await Payment.create({
        order_id: paymentOrder.orderId,
        user_id: userId,
        competition_id: competitionId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        user_type: userType.toLowerCase(),
        team_size: parseInt(teamSize),
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
      });

      logger.info(`Payment order created: ${paymentOrder.orderId} for user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          orderId: paymentOrder.orderId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          paymentUrl: paymentOrder.paymentUrl,
          expiresAt: payment.expires_at
        }
      });

    } catch (error) {
      logger.error('Error creating payment order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: error.message
      });
    }
  },

  // Get payment status
  getPaymentStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const payment = await Payment.findOne({
        where: { 
          order_id: orderId,
          user_id: userId 
        },
        include: [
          { model: Competition, as: 'competition', attributes: ['title'] }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: {
          orderId: payment.order_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          userType: payment.user_type,
          teamSize: payment.team_size,
          competition: payment.competition,
          createdAt: payment.created_at,
          paidAt: payment.paid_at,
          expiresAt: payment.expires_at,
          isExpired: payment.isExpired()
        }
      });

    } catch (error) {
      logger.error('Error getting payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
        error: error.message
      });
    }
  },

  // Handle payment callback/webhook
  handlePaymentCallback: async (req, res) => {
    try {
      const callbackData = req.body;
      
      logger.info('Payment callback received:', callbackData);

      const result = await paymentService.handlePaymentCallback(callbackData);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Payment callback processed successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process payment callback',
        error: error.message
      });
    }
  },

  // Get payment success page
  getPaymentSuccess: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const payment = await Payment.findOne({
        where: { order_id: orderId },
        include: [
          { model: Competition, as: 'competition', attributes: ['title'] },
          { model: User, as: 'user', attributes: ['name', 'email'] }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (userId && payment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        message: 'Payment completed successfully',
        data: {
          orderId: payment.order_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          competition: payment.competition,
          paidAt: payment.paid_at
        }
      });

    } catch (error) {
      logger.error('Error getting payment success:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment details',
        error: error.message
      });
    }
  },

  // Get payment failure page
  getPaymentFailure: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      const payment = await Payment.findOne({
        where: { order_id: orderId },
        include: [
          { model: Competition, as: 'competition', attributes: ['title'] }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (userId && payment.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: false,
        message: 'Payment failed',
        data: {
          orderId: payment.order_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          competition: payment.competition,
          failureReason: payment.failure_reason
        }
      });

    } catch (error) {
      logger.error('Error getting payment failure:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment details',
        error: error.message
      });
    }
  },

  // Get user's payment history
  getPaymentHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: { user_id: userId },
        include: [
          { model: Competition, as: 'competition', attributes: ['title'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          payments: payments.map(payment => ({
            orderId: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            userType: payment.user_type,
            teamSize: payment.team_size,
            competition: payment.competition,
            createdAt: payment.created_at,
            paidAt: payment.paid_at
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalPayments: count,
            hasNextPage: offset + limit < count,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error.message
      });
    }
  },

  // Verify payment manually
  verifyPayment: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { paymentId, signature } = req.body;
      const userId = req.user.id;

      const payment = await Payment.findOne({
        where: { 
          order_id: orderId,
          user_id: userId 
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const verification = await paymentService.verifyPayment(orderId, paymentId, signature);

      if (verification.success) {
        // Update payment record
        await payment.update({
          payment_id: paymentId,
          signature: signature,
          status: 'completed',
          paid_at: new Date()
        });

        res.json({
          success: true,
          message: 'Payment verified successfully',
          data: {
            orderId: payment.order_id,
            status: payment.status,
            paidAt: payment.paid_at
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment verification failed'
        });
      }

    } catch (error) {
      logger.error('Error verifying payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      });
    }
  },

  // Cancel payment order
  cancelPayment: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const payment = await Payment.findOne({
        where: { 
          order_id: orderId,
          user_id: userId 
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      if (!payment.isPending()) {
        return res.status(400).json({
          success: false,
          message: 'Payment cannot be cancelled'
        });
      }

      // Update payment status
      await payment.update({
        status: 'cancelled'
      });

      res.json({
        success: true,
        message: 'Payment cancelled successfully',
        data: {
          orderId: payment.order_id,
          status: payment.status
        }
      });

    } catch (error) {
      logger.error('Error cancelling payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel payment',
        error: error.message
      });
    }
  }
};

module.exports = paymentController;
