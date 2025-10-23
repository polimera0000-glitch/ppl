const crypto = require('crypto');
const { TeamInvitation, Registration, User, Competition } = require('../models');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class InvitationService {
  constructor() {
    this.defaultExpirationDays = 7;
    this.maxInvitationsPerRegistration = 10;
    this.maxInvitationsPerUserPerDay = 20;
  }

  /**
   * Generate a secure invitation token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create invitations for a team registration
   */
  async createInvitations(registration, emails, inviterId) {
    try {
      // Validate inputs
      if (!registration || !emails || !Array.isArray(emails) || emails.length === 0) {
        throw new Error('Invalid registration or emails provided');
      }

      // Validate email formats
      const invalidEmails = emails.filter(email => !this.validateEmail(email));
      if (invalidEmails.length > 0) {
        throw new Error(`Invalid email formats: ${invalidEmails.join(', ')}`);
      }

      // Check for duplicate emails
      const uniqueEmails = [...new Set(emails.map(email => email.toLowerCase()))];
      if (uniqueEmails.length !== emails.length) {
        throw new Error('Duplicate emails found in invitation list');
      }

      // Check team size limits
      const competition = await Competition.findByPk(registration.competition_id);
      if (!competition) {
        throw new Error('Competition not found');
      }

      const totalTeamSize = uniqueEmails.length + 1; // +1 for team leader
      if (totalTeamSize > competition.max_team_size) {
        throw new Error(`Team size (${totalTeamSize}) exceeds maximum allowed (${competition.max_team_size})`);
      }

      // Check for existing invitations
      const existingInvitations = await TeamInvitation.findAll({
        where: {
          registration_id: registration.id,
          invitee_email: uniqueEmails,
          status: ['pending', 'accepted']
        }
      });

      if (existingInvitations.length > 0) {
        const existingEmails = existingInvitations.map(inv => inv.invitee_email);
        throw new Error(`Invitations already exist for: ${existingEmails.join(', ')}`);
      }

      // Check daily invitation limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayInvitations = await TeamInvitation.count({
        where: {
          inviter_id: inviterId,
          created_at: {
            [require('sequelize').Op.gte]: today,
            [require('sequelize').Op.lt]: tomorrow
          }
        }
      });

      if (todayInvitations + uniqueEmails.length > this.maxInvitationsPerUserPerDay) {
        throw new Error(`Daily invitation limit exceeded. You can send ${this.maxInvitationsPerUserPerDay - todayInvitations} more invitations today.`);
      }

      // Create invitations
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + this.defaultExpirationDays);

      const invitations = [];
      for (const email of uniqueEmails) {
        // Check if email belongs to an existing user
        const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
        
        const invitation = await TeamInvitation.create({
          registration_id: registration.id,
          inviter_id: inviterId,
          invitee_email: email.toLowerCase(),
          invitee_id: existingUser ? existingUser.id : null,
          token: this.generateToken(),
          expires_at: expirationDate,
          status: 'pending'
        });

        invitations.push(invitation);
      }

      // Update registration status to pending invitations
      await registration.update({ invitation_status: 'pending_invitations' });

      logger.info(`Created ${invitations.length} invitations for registration ${registration.id}`);
      return invitations;

    } catch (error) {
      logger.error('Error creating invitations:', error.message);
      throw error;
    }
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(invitation) {
    try {
      // Load related data
      const registration = await Registration.findByPk(invitation.registration_id, {
        include: [
          { model: User, as: 'leader' },
          { model: Competition, as: 'competition' }
        ]
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      const teamLeader = registration.leader;
      const competition = registration.competition;
      const teamName = registration.team_name || `${teamLeader.name}'s Team`;

      // Find invitee user if exists
      const inviteeUser = invitation.invitee_id ? 
        await User.findByPk(invitation.invitee_id) : null;
      const inviteeName = inviteeUser ? inviteeUser.name : null;

      // Use EmailService method for consistent styling
      const result = await emailService.sendTeamInvitationEmail(
        invitation.invitee_email,
        inviteeName,
        teamLeader.name,
        teamName,
        competition.title,
        competition.description,
        invitation.token,
        invitation.expires_at,
        { 
          nonBlocking: true,
          competitionUrl: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/competitions/${competition.id}`
        }
      );

      logger.info(`Invitation email sent to ${invitation.invitee_email} for registration ${invitation.registration_id}`);
      return result;

    } catch (error) {
      logger.error(`Error sending invitation email to ${invitation.invitee_email}:`, error.message);
      throw error;
    }
  }

  /**
   * Process invitation response (accept/reject)
   */
  async processInvitationResponse(token, action, userId = null) {
    try {
      // Find invitation by token
      const invitation = await TeamInvitation.findOne({
        where: { token },
        include: [
          { 
            model: Registration, 
            as: 'registration',
            include: [
              { model: User, as: 'leader' },
              { model: Competition, as: 'competition' }
            ]
          },
          { model: User, as: 'inviter' }
        ]
      });

      if (!invitation) {
        throw new Error('Invalid invitation token');
      }

      // Check if invitation can be responded to
      if (!invitation.canRespond()) {
        if (invitation.isExpired()) {
          throw new Error('This invitation has expired');
        }
        throw new Error('This invitation has already been responded to');
      }

      const registration = invitation.registration;
      const competition = registration.competition;

      // Validate action
      if (!['accept', 'reject'].includes(action)) {
        throw new Error('Invalid action. Must be "accept" or "reject"');
      }

      // If accepting, check for conflicts
      if (action === 'accept') {
        // Check if user is already registered for this competition
        if (userId) {
          const existingRegistration = await Registration.checkUserRegistration(competition.id, userId);
          if (existingRegistration) {
            throw new Error('You are already registered for this competition');
          }
        }

        // Check team size limits
        const currentTeamSize = registration.getTeamSize();
        if (currentTeamSize >= competition.max_team_size) {
          throw new Error('Team is already at maximum capacity');
        }
      }

      // Process the response
      if (action === 'accept') {
        await invitation.accept(userId);
        
        // Add user to team if userId is provided
        if (userId) {
          await registration.addMemberFromInvitation(userId);
        }

        logger.info(`Invitation accepted: ${invitation.id} by user ${userId || 'unknown'}`);
      } else {
        await invitation.reject(userId);
        logger.info(`Invitation rejected: ${invitation.id} by user ${userId || 'unknown'}`);
      }

      // Update registration invitation status
      await registration.updateInvitationStatus();

      // Check if all invitations are resolved and auto-complete if needed
      const areAllResolved = await registration.areAllInvitationsResolved();
      if (areAllResolved && registration.status === 'pending') {
        await this.autoCompleteRegistration(registration);
      }

      // Send notification to team leader
      await this.notifyTeamLeader(invitation, action);

      return {
        success: true,
        action,
        invitation,
        registration,
        teamName: registration.team_name || `${registration.leader.name}'s Team`,
        competitionTitle: competition.title
      };

    } catch (error) {
      logger.error('Error processing invitation response:', error.message);
      throw error;
    }
  }

  /**
   * Send notification to team leader about invitation response
   */
  async notifyTeamLeader(invitation, action) {
    try {
      const registration = invitation.registration;
      const teamLeader = registration.leader;
      const competition = registration.competition;
      const teamName = registration.team_name || `${teamLeader.name}'s Team`;

      // Find invitee user if exists
      const inviteeUser = invitation.invitee_id ? 
        await User.findByPk(invitation.invitee_id) : null;
      const inviteeName = inviteeUser ? inviteeUser.name : null;

      // Use EmailService method for consistent styling
      await emailService.sendTeamInvitationResponseNotification(
        teamLeader.email,
        teamLeader.name,
        invitation.invitee_email,
        inviteeName,
        teamName,
        competition.title,
        action,
        { 
          nonBlocking: true,
          competitionUrl: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/competitions/${competition.id}`
        }
      );

      logger.info(`Team leader notification sent to ${teamLeader.email} for invitation ${invitation.id}`);

    } catch (error) {
      logger.error('Error sending team leader notification:', error.message);
      // Don't throw error here as it's not critical to the main flow
    }
  }

  /**
   * Clean up expired invitations
   */
  async cleanupExpiredInvitations() {
    try {
      const expiredCount = await TeamInvitation.cleanupExpired();
      
      if (expiredCount > 0) {
        logger.info(`Cleaned up ${expiredCount} expired invitations`);
      }
      
      return expiredCount;
    } catch (error) {
      logger.error('Error cleaning up expired invitations:', error.message);
      throw error;
    }
  }

  /**
   * Send batch invitations for a registration
   */
  async sendBatchInvitations(registration, emails, inviterId) {
    try {
      // Create invitations
      const invitations = await this.createInvitations(registration, emails, inviterId);
      
      // Send emails in parallel with error handling
      const emailResults = await Promise.allSettled(
        invitations.map(invitation => this.sendInvitationEmail(invitation))
      );

      // Log results
      const successful = emailResults.filter(result => result.status === 'fulfilled').length;
      const failed = emailResults.filter(result => result.status === 'rejected').length;

      logger.info(`Batch invitation results: ${successful} sent, ${failed} failed`);

      // Log failed emails for debugging
      emailResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error(`Failed to send invitation to ${invitations[index].invitee_email}:`, result.reason);
        }
      });

      return {
        invitations,
        emailResults,
        successful,
        failed
      };

    } catch (error) {
      logger.error('Error sending batch invitations:', error.message);
      throw error;
    }
  }

  /**
   * Send expired invitation notifications to team leaders
   */
  async notifyExpiredInvitations() {
    try {
      // Find registrations with expired invitations
      const expiredInvitations = await TeamInvitation.findAll({
        where: {
          status: 'pending',
          expires_at: { [require('sequelize').Op.lt]: new Date() }
        },
        include: [
          { 
            model: Registration, 
            as: 'registration',
            include: [
              { model: User, as: 'leader' },
              { model: Competition, as: 'competition' }
            ]
          }
        ]
      });

      // Group by registration
      const registrationGroups = {};
      expiredInvitations.forEach(invitation => {
        const regId = invitation.registration_id;
        if (!registrationGroups[regId]) {
          registrationGroups[regId] = {
            registration: invitation.registration,
            expiredEmails: []
          };
        }
        registrationGroups[regId].expiredEmails.push(invitation.invitee_email);
      });

      // Send notifications to team leaders
      const notifications = [];
      for (const regId in registrationGroups) {
        const { registration, expiredEmails } = registrationGroups[regId];
        const teamLeader = registration.leader;
        const competition = registration.competition;
        const teamName = registration.team_name || `${teamLeader.name}'s Team`;

        try {
          await emailService.sendTeamInvitationExpiredNotification(
            teamLeader.email,
            teamLeader.name,
            expiredEmails,
            teamName,
            competition.title,
            { 
              nonBlocking: true,
              competitionUrl: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/competitions/${competition.id}`
            }
          );

          notifications.push({
            registrationId: regId,
            teamLeaderEmail: teamLeader.email,
            expiredCount: expiredEmails.length,
            success: true
          });

        } catch (error) {
          logger.error(`Failed to send expired notification to ${teamLeader.email}:`, error.message);
          notifications.push({
            registrationId: regId,
            teamLeaderEmail: teamLeader.email,
            expiredCount: expiredEmails.length,
            success: false,
            error: error.message
          });
        }
      }

      // Mark invitations as expired
      await TeamInvitation.cleanupExpired();

      logger.info(`Sent ${notifications.filter(n => n.success).length} expired invitation notifications`);
      return notifications;

    } catch (error) {
      logger.error('Error notifying expired invitations:', error.message);
      throw error;
    }
  }

  /**
   * Auto-complete registration when all invitations are resolved
   */
  async autoCompleteRegistration(registration) {
    try {
      // Get accepted invitations to add members
      const acceptedInvitations = await registration.getAcceptedInvitations();
      
      // Add accepted members to the team
      for (const invitation of acceptedInvitations) {
        if (invitation.invitee_id) {
          await registration.addMemberFromInvitation(invitation.invitee_id);
        }
      }

      // Check if we have enough seats
      const competition = await Competition.findByPk(registration.competition_id);
      if (competition.seats_remaining <= 0) {
        logger.warn(`Cannot auto-complete registration ${registration.id}: No seats remaining`);
        return false;
      }

      // Complete the registration
      await registration.update({
        status: 'confirmed',
        invitation_status: 'complete'
      });

      // Update seats remaining
      await competition.update({
        seats_remaining: competition.seats_remaining - 1
      });

      // Send confirmation email
      try {
        const teamLeader = await User.findByPk(registration.leader_id);
        await emailService.sendCompetitionRegistrationEmail(
          teamLeader.email,
          teamLeader.name,
          competition.title
        );
      } catch (emailError) {
        logger.warn('Auto-completion confirmation email failed:', emailError.message);
      }

      logger.info(`Registration ${registration.id} auto-completed successfully`);
      return true;

    } catch (error) {
      logger.error('Error auto-completing registration:', error.message);
      return false;
    }
  }

  /**
   * Get invitation status for a registration
   */
  async getInvitationStatus(registrationId) {
    try {
      const invitations = await TeamInvitation.findByRegistration(registrationId);
      
      const statusCounts = {
        pending: 0,
        accepted: 0,
        rejected: 0,
        expired: 0
      };

      invitations.forEach(invitation => {
        if (invitation.isExpired() && invitation.status === 'pending') {
          statusCounts.expired++;
        } else {
          statusCounts[invitation.status]++;
        }
      });

      return {
        invitations,
        statusCounts,
        totalInvitations: invitations.length,
        isComplete: statusCounts.pending === 0
      };
    } catch (error) {
      logger.error('Error getting invitation status:', error.message);
      throw error;
    }
  }


}

module.exports = new InvitationService();