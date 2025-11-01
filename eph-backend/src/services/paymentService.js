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
   * Calculate amount for team with mixed user types
   */
  calculateTeamAmount(teamMembers) {
    return teamMembers.reduce((sum, member) => {
      const memberType = member.userType || 'graduate';
      const pricePerPerson = this.pricing[memberType.toLowerCase()] || this.pricing.graduate;
      return sum + pricePerPerson;
    }, 0);
  }

  /**
   * Generate payment order for competition registration using Getepay
   */
  async createPaymentOrder(registrationData) {
    try {
      // Validate gateway configuration
      if (!this.gatewayConfig.baseUrl || !this.gatewayConfig.merchantId || !this.gatewayConfig.secretKey || !this.gatewayConfig.terminalId) {
        logger.error('Missing Getepay configuration:', {
          hasBaseUrl: !!this.gatewayConfig.baseUrl,
          hasMerchantId: !!this.gatewayConfig.merchantId,
          hasSecretKey: !!this.gatewayConfig.secretKey,
          hasTerminalId: !!this.gatewayConfig.terminalId,
          baseUrl: this.gatewayConfig.baseUrl,
          merchantId: this.gatewayConfig.merchantId,
          terminalId: this.gatewayConfig.terminalId
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
        userName,
        totalAmount
      } = registrationData;

      // Validate registration data
      if (!competitionId || !userId || !userType) {
        logger.error('Missing required registration data:', {
          hasCompetitionId: !!competitionId,
          hasUserId: !!userId,
          hasUserType: !!userType
        });
        throw new Error('Required registration data is missing');
      }

      // Calculate amount - use provided totalAmount or calculate based on team size
      const amount = totalAmount || this.calculateAmount(userType, teamSize);

      // Generate unique order ID
      const orderId = this.generateOrderId(competitionId, userId);

      // Getepay will redirect to their own response page
      const returnUrl = process.env.PAYMENT_RETURN_URL;
      const callbackUrl = `${process.env.BACKEND_URL}/api/v1/payments/callback`;

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
        ru: returnUrl, // Return URL for browser redirect
        callbackUrl: callbackUrl, // Server-to-server callback
        currency: this.gatewayConfig.currency,
        paymentMode: 'ALL', // All payment modes
        bankId: '',
        txnType: 'single',
        productType: 'IPG',
        txnNote: `Competition Registration - ${competitionId}`,
        vpa: this.gatewayConfig.terminalId
      };

      // Log the URLs for debugging
      logger.info('Payment URLs configured:', { returnUrl, callbackUrl });

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
      logger.error('Error creating Getepay payment order:', {
        error: error.message,
        stack: error.stack,
        config: {
          hasBaseUrl: !!this.gatewayConfig.baseUrl,
          hasMerchantId: !!this.gatewayConfig.merchantId,
          hasSecretKey: !!this.gatewayConfig.secretKey,
          hasTerminalId: !!this.gatewayConfig.terminalId
        }
      });

      // For development, provide more detailed error information
      if (process.env.NODE_ENV === 'development') {
        logger.error('Detailed error info:', {
          errorType: error.constructor.name,
          errorCode: error.code,
          errorResponse: error.response?.data,
          errorStatus: error.response?.status
        });
      }

      // Fallback: Return simulated payment order for testing in development
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Using fallback simulation due to Getepay error in development');

        const orderId = this.generateOrderId(registrationData.competitionId, registrationData.userId);
        const amount = this.calculateAmount(registrationData.userType, registrationData.teamSize);

        return {
          success: true,
          orderId,
          amount,
          currency: this.gatewayConfig.currency,
          paymentUrl: `${process.env.FRONTEND_URL}/payment/simulate/${orderId}`, // Simulation URL
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
      logger.info('Processing payment callback:', callbackData);

      // Extract order ID from Getepay response
      const orderId = callbackData.merchantTransactionId || callbackData.orderId;
      const status = callbackData.status || callbackData.txnStatus;
      const paymentId = callbackData.paymentId || callbackData.txnId;
      const amount = callbackData.amount;

      if (!orderId) {
        throw new Error('Order ID not found in callback data');
      }

      // Check if payment was successful
      const isSuccess = status === 'SUCCESS' || status === 'COMPLETED' || status === 'success';

      if (isSuccess) {
        // Payment successful - complete registration
        await this.completeRegistrationAfterPayment(orderId);

        // Update payment record with gateway response
        const { Payment } = require('../models');
        await Payment.update({
          payment_id: paymentId,
          gateway_response: callbackData,
          status: 'completed',
          paid_at: new Date()
        }, {
          where: { order_id: orderId }
        });

        return {
          success: true,
          message: 'Payment completed successfully',
          orderId,
          status: 'completed'
        };
      } else {
        // Payment failed
        await this.handleFailedPayment(orderId, callbackData);

        return {
          success: false,
          message: 'Payment failed',
          orderId,
          status: 'failed'
        };
      }

    } catch (error) {
      logger.error('Error handling payment callback:', error);
      throw new Error('Payment callback processing failed: ' + error.message);
    }
  }

  /**
   * Complete registration after successful payment
   */
  async completeRegistrationAfterPayment(orderId) {
    try {
      const { Payment, Registration, Competition } = require('../models');

      // Find the payment record
      const payment = await Payment.findOne({
        where: { order_id: orderId }
      });

      if (!payment) {
        throw new Error(`Payment not found for order: ${orderId}`);
      }

      // Update payment status to completed
      await payment.update({
        status: 'completed',
        paid_at: new Date()
      });

      // Find existing registration or create new one
      let registration = await Registration.findOne({
        where: {
          competition_id: payment.competition_id,
          leader_id: payment.user_id
        }
      });

      if (registration) {
        // Update existing registration status to confirmed
        await registration.update({
          status: 'confirmed',
          confirmed_at: new Date()
        });

        // Update competition seats based on actual team size
        const competition = await Competition.findByPk(payment.competition_id);
        if (competition) {
          await competition.update({
            seats_remaining: Math.max(0, competition.seats_remaining - payment.team_size)
          });
        }

        logger.info(`Existing registration confirmed for order: ${orderId}, registration: ${registration.id}`);
      } else {
        // Create new registration for the paid user
        const competition = await Competition.findByPk(payment.competition_id);

        if (!competition) {
          throw new Error(`Competition not found: ${payment.competition_id}`);
        }

        // Determine registration type based on team size
        const registrationType = payment.team_size > 1 ? 'team' : 'individual';

        registration = await Registration.create({
          competition_id: payment.competition_id,
          leader_id: payment.user_id,
          type: registrationType,
          team_name: registrationType === 'team' ? `Team ${payment.user_id.substring(0, 8)}` : null,
          status: 'confirmed',
          confirmed_at: new Date(),
          invitation_status: 'complete'
        });

        // Update competition seats
        await competition.update({
          seats_remaining: Math.max(0, competition.seats_remaining - payment.team_size)
        });

        logger.info(`New registration created for order: ${orderId}, registration: ${registration.id}`);
      }

      // Link payment to registration
      await payment.update({
        registration_id: registration.id
      });

      logger.info(`Registration completed for order: ${orderId}, registration: ${registration.id}`);

    } catch (error) {
      logger.error('Error completing registration after payment:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(orderId, callbackData = null) {
    try {
      const { Payment } = require('../models');

      // Update payment status to failed
      const updateData = {
        status: 'failed',
        failure_reason: callbackData?.message || callbackData?.errorMessage || 'Payment failed'
      };

      if (callbackData) {
        updateData.gateway_response = callbackData;
      }

      await Payment.update(updateData, {
        where: { order_id: orderId }
      });

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