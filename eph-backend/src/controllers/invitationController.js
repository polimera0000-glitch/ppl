const { TeamInvitation, Registration, User, Competition } = require('../models');
const invitationService = require('../services/invitationService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const invitationController = {
  // Send team invitations
  sendInvitations: async (req, res) => {
    try {
      const { registrationId, emails } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!registrationId || !emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Registration ID and emails array are required'
        });
      }

      // Find registration and verify ownership
      const registration = await Registration.findByPk(registrationId, {
        include: [
          { model: User, as: 'leader' },
          { model: Competition, as: 'competition' }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found'
        });
      }

      // Check if user is the team leader
      if (registration.leader_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Only team leaders can send invitations'
        });
      }

      // Check if registration is in pending status
      if (registration.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Invitations can only be sent for pending registrations'
        });
      }

      // Check if registration is for team type
      if (registration.type !== 'team') {
        return res.status(400).json({
          success: false,
          error: 'Invitations can only be sent for team registrations'
        });
      }

      // Send batch invitations
      const result = await invitationService.sendBatchInvitations(
        registration,
        emails,
        userId
      );

      logger.info(`User ${userId} sent ${result.successful} invitations for registration ${registrationId}`);

      res.status(201).json({
        success: true,
        message: `${result.successful} invitations sent successfully`,
        data: {
          invitations: result.invitations,
          successful: result.successful,
          failed: result.failed,
          registration: {
            id: registration.id,
            team_name: registration.team_name,
            competition_title: registration.competition.title,
            invitation_status: 'pending_invitations'
          }
        }
      });

    } catch (error) {
      logger.error('Error sending invitations:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send invitations'
      });
    }
  },

  // Respond to invitation (accept/reject)
  respondToInvitation: async (req, res) => {
    try {
      const { token } = req.params;
      const { action } = req.body;
      const userId = req.user?.id; // Optional - user might not be logged in

      // Validate action
      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Action must be "accept" or "reject"'
        });
      }

      // Process invitation response
      const result = await invitationService.processInvitationResponse(
        token,
        action,
        userId
      );

      logger.info(`Invitation ${token} ${action}ed by user ${userId || 'anonymous'}`);

      res.status(200).json({
        success: true,
        message: `Invitation ${action}ed successfully`,
        data: {
          action: result.action,
          team_name: result.teamName,
          competition_title: result.competitionTitle,
          invitation: {
            id: result.invitation.id,
            status: result.invitation.status,
            responded_at: result.invitation.responded_at
          }
        }
      });

    } catch (error) {
      logger.error('Error responding to invitation:', error.message);
      
      // Handle specific error cases
      if (error.message.includes('Invalid invitation token')) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found or invalid'
        });
      }
      
      if (error.message.includes('expired')) {
        return res.status(410).json({
          success: false,
          error: 'This invitation has expired'
        });
      }
      
      if (error.message.includes('already responded')) {
        return res.status(409).json({
          success: false,
          error: 'This invitation has already been responded to'
        });
      }

      if (error.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          error: 'You are already registered for this competition'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process invitation response'
      });
    }
  },

  // Get invitation details by token (for response page)
  getInvitationByToken: async (req, res) => {
    try {
      const { token } = req.params;

      const invitation = await TeamInvitation.findOne({
        where: { token },
        include: [
          {
            model: Registration,
            as: 'registration',
            include: [
              { model: User, as: 'leader', attributes: ['id', 'name', 'email'] },
              { 
                model: Competition, 
                as: 'competition', 
                attributes: ['id', 'title', 'description', 'start_date', 'end_date', 'max_team_size']
              }
            ]
          },
          { model: User, as: 'inviter', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'invitee', attributes: ['id', 'name', 'email'] }
        ]
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check if invitation is expired
      const isExpired = invitation.isExpired();
      const canRespond = invitation.canRespond();

      res.status(200).json({
        success: true,
        data: {
          invitation: {
            id: invitation.id,
            token: invitation.token,
            status: invitation.status,
            expires_at: invitation.expires_at,
            responded_at: invitation.responded_at,
            is_expired: isExpired,
            can_respond: canRespond
          },
          team: {
            name: invitation.registration.team_name || `${invitation.registration.leader.name}'s Team`,
            leader: invitation.registration.leader,
            current_size: invitation.registration.getTeamSize()
          },
          competition: invitation.registration.competition,
          inviter: invitation.inviter,
          invitee: invitation.invitee
        }
      });

    } catch (error) {
      logger.error('Error getting invitation by token:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve invitation details'
      });
    }
  },

  // Get invitation status for a registration
  getInvitationStatus: async (req, res) => {
    try {
      const { registrationId } = req.params;
      const userId = req.user.id;

      // Find registration and verify ownership
      const registration = await Registration.findByPk(registrationId, {
        include: [{ model: User, as: 'leader' }]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found'
        });
      }

      // Check if user is the team leader or admin
      if (registration.leader_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Get invitation status
      const status = await invitationService.getInvitationStatus(registrationId);

      res.status(200).json({
        success: true,
        data: {
          registration_id: registrationId,
          invitation_status: registration.invitation_status,
          ...status
        }
      });

    } catch (error) {
      logger.error('Error getting invitation status:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve invitation status'
      });
    }
  },

  // Resend invitation
  resendInvitation: async (req, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user.id;

      // Find invitation
      const invitation = await TeamInvitation.findByPk(invitationId, {
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

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check if user is the team leader
      if (invitation.registration.leader_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Only team leaders can resend invitations'
        });
      }

      // Check if invitation is pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Only pending invitations can be resent'
        });
      }

      // Update expiration date
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + 7);
      invitation.expires_at = newExpirationDate;
      await invitation.save(['expires_at']);

      // Resend email
      await invitationService.sendInvitationEmail(invitation);

      logger.info(`User ${userId} resent invitation ${invitationId}`);

      res.status(200).json({
        success: true,
        message: 'Invitation resent successfully',
        data: {
          invitation: {
            id: invitation.id,
            expires_at: invitation.expires_at,
            status: invitation.status
          }
        }
      });

    } catch (error) {
      logger.error('Error resending invitation:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to resend invitation'
      });
    }
  },

  // Cancel invitation
  cancelInvitation: async (req, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user.id;

      // Find invitation
      const invitation = await TeamInvitation.findByPk(invitationId, {
        include: [
          {
            model: Registration,
            as: 'registration',
            include: [{ model: User, as: 'leader' }]
          }
        ]
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check if user is the team leader
      if (invitation.registration.leader_id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Only team leaders can cancel invitations'
        });
      }

      // Check if invitation is pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Only pending invitations can be cancelled'
        });
      }

      // Delete invitation
      await invitation.destroy();

      // Update registration invitation status
      await invitation.registration.updateInvitationStatus();

      logger.info(`User ${userId} cancelled invitation ${invitationId}`);

      res.status(200).json({
        success: true,
        message: 'Invitation cancelled successfully'
      });

    } catch (error) {
      logger.error('Error cancelling invitation:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel invitation'
      });
    }
  },

  // Serve invitation response page
  serveInvitationResponsePage: async (req, res) => {
    try {
      const path = require('path');
      const fs = require('fs');
      
      const htmlPath = path.join(__dirname, '../views/invitation-response.html');
      
      // Check if file exists
      if (!fs.existsSync(htmlPath)) {
        return res.status(404).json({
          success: false,
          error: 'Invitation response page not found'
        });
      }
      
      // Read and serve the HTML file
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      
    } catch (error) {
      logger.error('Error serving invitation response page:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to load invitation response page'
      });
    }
  },

  // Get user's received invitations
  getMyInvitations: async (req, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      const { status = 'all' } = req.query;

      const whereClause = {
        [Op.or]: [
          { invitee_id: userId },
          { invitee_email: userEmail }
        ]
      };

      if (status !== 'all') {
        whereClause.status = status;
      }

      const invitations = await TeamInvitation.findAll({
        where: whereClause,
        include: [
          {
            model: Registration,
            as: 'registration',
            include: [
              { model: User, as: 'leader', attributes: ['id', 'name', 'email'] },
              { 
                model: Competition, 
                as: 'competition', 
                attributes: ['id', 'title', 'description', 'start_date', 'end_date']
              }
            ]
          },
          { model: User, as: 'inviter', attributes: ['id', 'name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
      });

      // Add computed fields
      const invitationsWithStatus = invitations.map(invitation => ({
        ...invitation.toJSON(),
        is_expired: invitation.isExpired(),
        can_respond: invitation.canRespond(),
        team_name: invitation.registration.team_name || `${invitation.registration.leader.name}'s Team`
      }));

      res.status(200).json({
        success: true,
        data: {
          invitations: invitationsWithStatus,
          total: invitations.length
        }
      });

    } catch (error) {
      logger.error('Error getting user invitations:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve invitations'
      });
    }
  }
};

module.exports = invitationController;