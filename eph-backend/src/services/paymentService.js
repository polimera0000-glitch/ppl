// src/services/paymentService.js
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    // Payment gateway configuration
    this.gatewayConfig = {
      baseUrl: process.env.PAYMENT_GATEWAY_URL || '',
      merchantId: process.env.PAYMENT_MERCHANT_ID || '',
      secretKey: process.env.PAYMENT_SECRET_KEY || '',
      currency: 'INR'
    };

    // Pricing configuration
    this.pricing = {
      undergraduate: 500, // ₹500 per person
      graduate: 1000      // ₹1000 per person
    };
  }

  /**
   * Calculate registration amount based on user type and team size
   */
  calculateAmount(userType, teamSize = 1) {
    const pricePerPerson = this.pricing[userType.toLowerCase()] || this.pricing.graduate;
    return pricePerPerson * teamSize;
  }

  /**
   * Generate payment order for competition registration
   */
  async createPaymentOrder(registrationData) {
    try {
      const { 
        competitionId, 
        userId, 
        userType, 
        teamSize, 
        teamName,
        userEmail,
        userName 
      } = registrationData;

      // Calculate amount
      const amount = this.calculateAmount(userType, teamSize);

      // Generate unique order ID
      const orderId = this.generateOrderId(competitionId, userId);

      // Create payment order data
      const paymentOrder = {
        orderId,
        amount,
        currency: this.gatewayConfig.currency,
        competitionId,
        userId,
        userType,
        teamSize,
        teamName,
        userEmail,
        userName,
        status: 'pending',
        createdAt: new Date()
      };

      // TODO: Call payment gateway API to create order
      // This will be implemented once we have the gateway details
      
      logger.info(`Payment order created: ${orderId} for amount ₹${amount}`);
      
      return {
        success: true,
        orderId,
        amount,
        currency: this.gatewayConfig.currency,
        paymentUrl: this.generatePaymentUrl(paymentOrder)
      };

    } catch (error) {
      logger.error('Error creating payment order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Generate unique order ID
   */
  generateOrderId(competitionId, userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `EPH_${competitionId.substring(0, 8)}_${userId.substring(0, 8)}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Generate payment URL for gateway
   */
  generatePaymentUrl(paymentOrder) {
    // TODO: Implement based on gateway documentation
    // For now, return a placeholder URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}/payment/${paymentOrder.orderId}`;
  }

  /**
   * Verify payment status
   */
  async verifyPayment(orderId, paymentId, signature) {
    try {
      // TODO: Implement payment verification based on gateway API
      
      logger.info(`Verifying payment: ${orderId}`);
      
      // Placeholder verification logic
      return {
        success: true,
        status: 'completed',
        paymentId,
        orderId
      };

    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw new Error('Payment verification failed');
    }
  }

  /**
   * Handle payment callback/webhook
   */
  async handlePaymentCallback(callbackData) {
    try {
      const { orderId, status, paymentId, signature } = callbackData;

      // Verify payment
      const verification = await this.verifyPayment(orderId, paymentId, signature);

      if (verification.success && verification.status === 'completed') {
        // Payment successful - complete registration
        await this.completeRegistrationAfterPayment(orderId);
        
        return {
          success: true,
          message: 'Payment completed successfully'
        };
      } else {
        // Payment failed
        await this.handleFailedPayment(orderId);
        
        return {
          success: false,
          message: 'Payment verification failed'
        };
      }

    } catch (error) {
      logger.error('Error handling payment callback:', error);
      throw new Error('Payment callback processing failed');
    }
  }

  /**
   * Complete registration after successful payment
   */
  async completeRegistrationAfterPayment(orderId) {
    try {
      // TODO: Update registration status to confirmed
      // TODO: Send confirmation email
      // TODO: Update payment record
      
      logger.info(`Registration completed for order: ${orderId}`);
      
    } catch (error) {
      logger.error('Error completing registration after payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(orderId) {
    try {
      // TODO: Update payment status to failed
      // TODO: Send failure notification
      
      logger.info(`Payment failed for order: ${orderId}`);
      
    } catch (error) {
      logger.error('Error handling failed payment:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId) {
    try {
      // TODO: Query payment gateway for status
      
      return {
        orderId,
        status: 'pending', // pending, completed, failed, cancelled
        amount: 0,
        currency: this.gatewayConfig.currency
      };

    } catch (error) {
      logger.error('Error getting payment status:', error);
      throw new Error('Failed to get payment status');
    }
  }
}

module.exports = new PaymentService();