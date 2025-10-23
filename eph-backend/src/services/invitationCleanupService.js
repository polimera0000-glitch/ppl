const invitationService = require('./invitationService');
const logger = require('../utils/logger');
const cron = require('node-cron');

class InvitationCleanupService {
  constructor() {
    this.isRunning = false;
    this.cleanupJob = null;
    this.notificationJob = null;
  }

  /**
   * Start the cleanup service with scheduled tasks
   */
  start() {
    if (this.isRunning) {
      logger.warn('Invitation cleanup service is already running');
      return;
    }

    logger.info('Starting invitation cleanup service...');

    // Run cleanup every hour
    this.cleanupJob = cron.schedule('0 * * * *', async () => {
      await this.runCleanup();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Send expiration notifications every 6 hours
    this.notificationJob = cron.schedule('0 */6 * * *', async () => {
      await this.sendExpirationNotifications();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.isRunning = true;
    logger.info('Invitation cleanup service started successfully');
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Invitation cleanup service is not running');
      return;
    }

    logger.info('Stopping invitation cleanup service...');

    if (this.cleanupJob) {
      this.cleanupJob.destroy();
      this.cleanupJob = null;
    }

    if (this.notificationJob) {
      this.notificationJob.destroy();
      this.notificationJob = null;
    }

    this.isRunning = false;
    logger.info('Invitation cleanup service stopped');
  }

  /**
   * Run the cleanup process
   */
  async runCleanup() {
    try {
      logger.info('Running invitation cleanup...');

      const cleanedCount = await invitationService.cleanupExpiredInvitations();
      
      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired invitations`);
      } else {
        logger.debug('No expired invitations to clean up');
      }

      // Update registration statuses for completed invitations
      await this.updateCompletedRegistrations();

    } catch (error) {
      logger.error('Error during invitation cleanup:', error.message);
    }
  }

  /**
   * Send expiration notifications to team leaders
   */
  async sendExpirationNotifications() {
    try {
      logger.info('Sending expiration notifications...');

      const notifications = await invitationService.notifyExpiredInvitations();
      
      const successCount = notifications.filter(n => n.success).length;
      const failCount = notifications.filter(n => !n.success).length;

      if (successCount > 0) {
        logger.info(`Sent ${successCount} expiration notifications`);
      }

      if (failCount > 0) {
        logger.warn(`Failed to send ${failCount} expiration notifications`);
      }

    } catch (error) {
      logger.error('Error sending expiration notifications:', error.message);
    }
  }

  /**
   * Update registration statuses for completed invitations
   */
  async updateCompletedRegistrations() {
    try {
      const { Registration } = require('../models');
      
      // Find registrations with pending invitation status
      const pendingRegistrations = await Registration.findAll({
        where: {
          invitation_status: 'pending_invitations',
          status: 'pending'
        }
      });

      let updatedCount = 0;

      for (const registration of pendingRegistrations) {
        try {
          const areAllResolved = await registration.areAllInvitationsResolved();
          
          if (areAllResolved) {
            // Auto-complete the registration
            const completed = await invitationService.autoCompleteRegistration(registration);
            
            if (completed) {
              updatedCount++;
              logger.info(`Auto-completed registration ${registration.id}`);
            }
          }
        } catch (error) {
          logger.warn(`Failed to update registration ${registration.id}:`, error.message);
        }
      }

      if (updatedCount > 0) {
        logger.info(`Auto-completed ${updatedCount} registrations`);
      }

    } catch (error) {
      logger.error('Error updating completed registrations:', error.message);
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cleanupJobActive: this.cleanupJob ? this.cleanupJob.getStatus() : null,
      notificationJobActive: this.notificationJob ? this.notificationJob.getStatus() : null
    };
  }

  /**
   * Run cleanup manually (for testing or admin triggers)
   */
  async runManualCleanup() {
    logger.info('Running manual invitation cleanup...');
    
    const results = {
      cleanedInvitations: 0,
      sentNotifications: 0,
      completedRegistrations: 0,
      errors: []
    };

    try {
      // Run cleanup
      results.cleanedInvitations = await invitationService.cleanupExpiredInvitations();
      
      // Send notifications
      const notifications = await invitationService.notifyExpiredInvitations();
      results.sentNotifications = notifications.filter(n => n.success).length;
      
      // Update registrations
      await this.updateCompletedRegistrations();
      
      logger.info('Manual cleanup completed successfully', results);
      return results;

    } catch (error) {
      logger.error('Error during manual cleanup:', error.message);
      results.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Get invitation analytics
   */
  async getAnalytics() {
    try {
      const { TeamInvitation, Registration } = require('../models');
      const { Op } = require('sequelize');

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get invitation statistics
      const [
        totalInvitations,
        pendingInvitations,
        acceptedInvitations,
        rejectedInvitations,
        expiredInvitations,
        invitationsLast24h,
        invitationsLast7d,
        pendingRegistrations
      ] = await Promise.all([
        TeamInvitation.count(),
        TeamInvitation.count({ where: { status: 'pending' } }),
        TeamInvitation.count({ where: { status: 'accepted' } }),
        TeamInvitation.count({ where: { status: 'rejected' } }),
        TeamInvitation.count({ where: { status: 'expired' } }),
        TeamInvitation.count({ where: { created_at: { [Op.gte]: last24Hours } } }),
        TeamInvitation.count({ where: { created_at: { [Op.gte]: last7Days } } }),
        Registration.count({ where: { invitation_status: 'pending_invitations' } })
      ]);

      return {
        invitations: {
          total: totalInvitations,
          pending: pendingInvitations,
          accepted: acceptedInvitations,
          rejected: rejectedInvitations,
          expired: expiredInvitations,
          acceptance_rate: totalInvitations > 0 ? (acceptedInvitations / totalInvitations * 100).toFixed(2) : 0
        },
        activity: {
          last_24_hours: invitationsLast24h,
          last_7_days: invitationsLast7d
        },
        registrations: {
          pending_invitations: pendingRegistrations
        },
        service_status: this.getStatus()
      };

    } catch (error) {
      logger.error('Error getting invitation analytics:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const invitationCleanupService = new InvitationCleanupService();

module.exports = invitationCleanupService;