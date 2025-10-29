// src/services/paymentService.js
const logger = require('../utils/logger');
const GetepayEncryption = require('../utils/getepayEncryption');
const axios = require('axios');

class PaymentService {
  constructor() {
    // Getepay gateway configuration
    this.gatewayConfig = {
      baseUrl: process.env.PAYMENT_GATEWAY_URL || '',
      merchantId: process.env.PAYMENT_MERCHANT_ID || '',
      terminalId: process.env.PAYMENT_TERMINAL_ID || '',
      secretKey: process.env.PAYMENT_SECRET_KEY || '',
      iv: process.env.PAYMENT_IV || '',
      currency: 'INR',
      returnUrl: process.env.PAYMENT_RETURN_URL || process.env.FRONTEND_URL + '/payment/success'
    };

    // Initialize encryption
    this.encryption = new GetepayEncryption();

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
   * Generate payment order for competition registration using Getepay
   */
  async createPaymentOrder(registrationData) {
    try {
      // Validate gateway configuration
      if (!this.gatewayConfig.baseUrl || !this.gatewayConfig.merchantId || !this.gatewayConfig.secretKey) {
        logger.error('Missing Getepay configuration:', {
          hasBaseUrl: !!this.gatewayConfig.baseUrl,
          hasMerchantId: !!this.gatewayConfig.merchantId,
          hasSecretKey: !!this.gatewayConfig.secretKey,
          hasTerminalId: !!this.gatewayConfig.terminalId
        });
        throw new Error('Payment gateway configuration is incomplete');
      }
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

      // Create Getepay request data
      const getepayData = {
        mid: this.gatewayConfig.merchantId,
        amount: amount.toFixed(2),
        merchantTransactionId: orderId,
        transactionDate: new Date().toString(),
        terminalId: this.gatewayConfig.terminalId,
        udf1: userEmail || '', // User email
        udf2: userName || '', // User name
        udf3: teamName || 'Individual Registration', // Team name or type
        udf4: competitionId, // Competition ID
        udf5: userType, // User type (undergraduate/graduate)
        udf6: '', // Reserved for split payment
        udf7: teamSize.toString(), // Team size
        udf8: '', // Reserved
        udf9: '', // Reserved
        udf10: '', // Reserved
        ru: this.gatewayConfig.returnUrl,
        callbackUrl: '', // Optional callback URL
        currency: this.gatewayConfig.currency,
        paymentMode: 'ALL', // All payment modes
        bankId: '',
        txnType: 'single',
        productType: 'IPG',
        txnNote: `Competition Registration - ${competitionId}`,
        vpa: this.gatewayConfig.terminalId
      };

      // Encrypt the request data
      logger.info('Encrypting Getepay data:', getepayData);
      const encryptedReq = await this.encryption.encrypt(getepayData);
      logger.info('Encryption successful, encrypted length:', encryptedReq.length);

      // Prepare API request
      const requestPayload = {
        mid: this.gatewayConfig.merchantId,
        terminalId: this.gatewayConfig.terminalId,
        req: encryptedReq
      };

      // Debug logging
      logger.info('Getepay request payload:', {
        mid: requestPayload.mid,
        terminalId: requestPayload.terminalId,
        hasEncryptedReq: !!requestPayload.req
      });
      logger.info('Getepay gateway URL:', this.gatewayConfig.baseUrl);

      // Call Getepay API
      const response = await axios.post(this.gatewayConfig.baseUrl, requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      logger.info('Getepay API response status:', response.status);
      logger.info('Getepay API response data:', response.data);

      if (response.data) {
        logger.info('Full Getepay response:', response.data);
        
        if (response.data.res) {
          // Decrypt the response
          const decryptedResponse = await this.encryption.decrypt(response.data.res);
          
          logger.info(`Getepay payment order created: ${orderId}`, decryptedResponse);
          
          return {
            success: true,
            orderId,
            amount,
            currency: this.gatewayConfig.currency,
            paymentUrl: decryptedResponse.paymentUrl,
            paymentId: decryptedResponse.paymentId,
            token: decryptedResponse.token,
            qrIntent: decryptedResponse.qrIntent,
            gatewayResponse: decryptedResponse
          };
        } else if (response.data.status === 'SUCCESS' && response.data.response) {
          // Handle success response with encrypted data in 'response' field instead of 'res'
          logger.info('Getepay success response with encrypted data in response field');
          const decryptedResponse = await this.encryption.decrypt(response.data.response);
          
          logger.info(`Getepay payment order created: ${orderId}`, decryptedResponse);
          
          return {
            success: true,
            orderId,
            amount,
            currency: this.gatewayConfig.currency,
            paymentUrl: decryptedResponse.paymentUrl,
            paymentId: decryptedResponse.paymentId,
            token: decryptedResponse.token,
            qrIntent: decryptedResponse.qrIntent,
            gatewayResponse: decryptedResponse
          };
        } else if (response.data.status === 'error' || (response.data.message && response.data.status !== 'SUCCESS')) {
          // Handle error response from Getepay
          logger.error('Getepay error response:', response.data);
          throw new Error(`Getepay error: ${response.data.message || 'Unknown error'}`);
        } else {
          logger.error('Unexpected Getepay response format:', response.data);
          throw new Error('Invalid response format from Getepay gateway');
        }
      } else {
        logger.error('Empty response from Getepay');
        throw new Error('Empty response from Getepay gateway');
      }

    } catch (error) {
      logger.error('Error creating Getepay payment order:', error);
      
      // Fallback: Return simulated payment order for testing
      if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_FALLBACK_SIMULATION === 'true') {
        logger.warn('Using fallback simulation due to Getepay error');
        
        const orderId = this.generateOrderId(competitionId, userId);
        const amount = this.calculateAmount(userType, teamSize);
        
        return {
          success: true,
          orderId,
          amount,
          currency: this.gatewayConfig.currency,
          paymentUrl: null, // No payment URL - will use simulation
          paymentId: `SIM_${orderId}`,
          token: null,
          qrIntent: null,
          gatewayResponse: { simulation: true }
        };
      }
      
      throw new Error('Failed to create payment order: ' + error.message);
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