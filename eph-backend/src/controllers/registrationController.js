const { Registration, Competition, User } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const registrationController = {
  // Get all registrations (admin/hiring/investor only)
  getAllRegistrations: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        competition_id,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add filters
      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (competition_id) whereClause.competition_id = competition_id;

      // Search functionality
      const includeClause = [
        {
          model: Competition,
          as: 'competition',
          attributes: ['id', 'title', 'start_date', 'end_date'],
          where: search ? {
            title: { [Op.iLike]: `%${search}%` }
          } : undefined
        },
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'name', 'email', 'college', 'branch', 'profile_pic_url'],
          where: search ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } },
              { college: { [Op.iLike]: `%${search}%` } }
            ]
          } : undefined
        },
        {
          model: User,
          as: 'teamMembers',
          attributes: ['id', 'name', 'email', 'college', 'branch'],
          through: { attributes: [] },
          required: false
        }
      ];

      const { rows: registrations, count } = await Registration.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        distinct: true
      });

      // Add invitation status summary for team registrations
      const registrationsWithInvitations = await Promise.all(
        registrations.map(async (registration) => {
          const regData = registration.toJSON();
          
          // Add invitation summary for team registrations
          if (registration.type === 'team' && registration.invitation_status === 'pending_invitations') {
            try {
              const invitationService = require('../services/invitationService');
              const invitationStatus = await invitationService.getInvitationStatus(registration.id);
              regData.invitation_summary = {
                total: invitationStatus.totalInvitations,
                pending: invitationStatus.statusCounts.pending,
                accepted: invitationStatus.statusCounts.accepted,
                rejected: invitationStatus.statusCounts.rejected,
                expired: invitationStatus.statusCounts.expired,
                is_complete: invitationStatus.isComplete
              };
            } catch (error) {
              logger.warn(`Failed to load invitation summary for registration ${registration.id}:`, error.message);
              regData.invitation_summary = null;
            }
          }
          
          return regData;
        })
      );

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          registrations: registrationsWithInvitations,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRegistrations: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get all registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registrations',
        error: error.message
      });
    }
  },

  // Get registration by ID
  getRegistrationById: async (req, res) => {
    try {
      const { id } = req.params;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'start_date', 'end_date', 'max_team_size']
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email', 'college', 'branch', 'year', 'profile_pic_url']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email', 'college', 'branch', 'year', 'profile_pic_url'],
            through: { attributes: [] }
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Check if user has permission to view this registration
      const isOwner = registration.leader_id === req.user.id;
      const isMember = registration.teamMembers?.some(member => member.id === req.user.id);
      const isAuthorized = req.user.role === 'admin' || req.user.role === 'hiring' || req.user.role === 'investor';

      if (!isOwner && !isMember && !isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Include invitation data for team registrations if user is the leader or admin
      let invitationData = null;
      if (registration.type === 'team' && (isOwner || isAuthorized)) {
        try {
          const invitationService = require('../services/invitationService');
          invitationData = await invitationService.getInvitationStatus(id);
        } catch (invitationError) {
          logger.warn('Failed to load invitation data:', invitationError.message);
          // Don't fail the request if invitation data fails to load
        }
      }

      const responseData = {
        registration: registration.toJSON()
      };

      // Add invitation data if available
      if (invitationData) {
        responseData.invitations = invitationData;
      }

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      logger.error('Get registration by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registration',
        error: error.message
      });
    }
  },

  // Get detailed invitation management data for a registration
  getRegistrationInvitations: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'max_team_size']
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Check if user is the team leader or admin
      const isOwner = registration.leader_id === userId;
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only team leaders and admins can view invitation details.'
        });
      }

      // Only team registrations have invitations
      if (registration.type !== 'team') {
        return res.status(400).json({
          success: false,
          message: 'Individual registrations do not have invitations'
        });
      }

      // Get detailed invitation data
      const invitationService = require('../services/invitationService');
      const invitationData = await invitationService.getInvitationStatus(id);

      // Get current team size
      const currentTeamSize = registration.getTeamSize();
      const maxTeamSize = registration.competition.max_team_size;

      res.json({
        success: true,
        data: {
          registration: {
            id: registration.id,
            team_name: registration.team_name,
            type: registration.type,
            status: registration.status,
            invitation_status: registration.invitation_status,
            current_team_size: currentTeamSize,
            max_team_size: maxTeamSize,
            can_add_members: currentTeamSize < maxTeamSize
          },
          competition: registration.competition,
          team_leader: registration.leader,
          invitations: invitationData.invitations.map(invitation => ({
            id: invitation.id,
            invitee_email: invitation.invitee_email,
            invitee_name: invitation.invitee ? invitation.invitee.name : null,
            status: invitation.status,
            created_at: invitation.created_at,
            expires_at: invitation.expires_at,
            responded_at: invitation.responded_at,
            is_expired: invitation.isExpired(),
            can_resend: invitation.status === 'pending' && !invitation.isExpired()
          })),
          summary: {
            total_invitations: invitationData.totalInvitations,
            status_counts: invitationData.statusCounts,
            is_complete: invitationData.isComplete,
            can_complete_registration: invitationData.isComplete && registration.status === 'pending'
          }
        }
      });

    } catch (error) {
      logger.error('Get registration invitations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invitation details',
        error: error.message
      });
    }
  },

  // Update registration status (admin only)
  updateRegistrationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title']
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      const oldStatus = registration.status;
      await registration.update({ 
        status,
        feedback: feedback || registration.feedback
      });

      // Handle seat management when status changes
      if (oldStatus !== status) {
        const competition = registration.competition;
        
        if (oldStatus === 'confirmed' && status !== 'confirmed') {
          // Free up a seat
          await competition.update({
            seats_remaining: competition.seats_remaining + 1
          });
        } else if (oldStatus !== 'confirmed' && status === 'confirmed') {
          // Take up a seat (if available)
          if (competition.seats_remaining > 0) {
            await competition.update({
              seats_remaining: competition.seats_remaining - 1
            });
          } else {
            return res.status(400).json({
              success: false,
              message: 'No seats remaining for confirmation'
            });
          }
        }
      }

      // Send notification email if status changed
      if (oldStatus !== status) {
        try {
          await emailService.sendRegistrationStatusUpdate(
            registration.leader.email,
            registration.leader.name,
            registration.competition.title,
            status,
            feedback
          );

          const members = await registration.getTeamMembers({
    attributes: ['name','email'],
    joinTableAttributes: []
  });
  if (members?.length) {
    await emailService.sendToMany(
      members.map(m =>
        emailService.sendRegistrationStatusUpdate(
          m.email,
          m.name,
          registration.competition.title,
          status,
          feedback
        )
      )
    );
  }
        } catch (emailError) {
          logger.error('Failed to send status update email:', emailError);
        }
      }

      res.json({
        success: true,
        message: 'Registration status updated successfully',
        data: {
          registration: registration.toJSON()
        }
      });

    } catch (error) {
      logger.error('Update registration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update registration status',
        error: error.message
      });
    }
  },

  // Submit project for registration
  submitProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { submission_url } = req.body;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'end_date']
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Check if user is the leader
      if (registration.leader_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can submit project'
        });
      }

      // Check if registration is confirmed
      if (registration.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Registration must be confirmed to submit project'
        });
      }

      // Check if competition has ended
      if (new Date() > new Date(registration.competition.end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Competition submission deadline has passed'
        });
      }

      await registration.submitProject(submission_url);

      try {
  const compTitle = registration.competition.title;
  const leader = await registration.getLeader({ attributes: ['name','email'] });
  const members = await registration.getTeamMembers({ attributes: ['name','email'], joinTableAttributes: [] });

  await emailService.sendSubmissionReceivedEmail(
    leader.email,
    leader.name,
    compTitle,
    submission_url // using URL as title; swap if you store a nicer title
  );

  if (members?.length) {
    await emailService.sendToMany(
      members.map(m =>
        emailService.sendSubmissionReceivedEmail(
          m.email,
          m.name,
          compTitle,
          submission_url
        )
      )
    );
  }
} catch (emailError) {
  logger.error('Failed to send submission receipt emails:', emailError);
}


      res.json({
        success: true,
        message: 'Project submitted successfully',
        data: {
          registration: registration.toJSON()
        }
      });

    } catch (error) {
      logger.error('Submit project error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit project',
        error: error.message
      });
    }
  },

  // Update registration score (admin only)
  updateRegistrationScore: async (req, res) => {
    try {
      const { id } = req.params;
      const { score, rank, feedback } = req.body;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title']
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Check if project has been submitted
      if (!registration.hasSubmitted()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot score registration without project submission'
        });
      }

      await registration.setScore(score, rank, feedback);

      // Award XP to leader and team members based on performance
      const user = await User.findByPk(registration.leader_id);
      let xpPoints = 50; // Base XP for participation

      // Bonus XP based on rank/score
      if (rank === 1) xpPoints += 200; // Winner
      else if (rank === 2) xpPoints += 150; // Second place
      else if (rank === 3) xpPoints += 100; // Third place
      else if (score >= 80) xpPoints += 75; // High score
      else if (score >= 60) xpPoints += 50; // Good score

      await user.addXP(xpPoints, `Competition: ${registration.competition.title}`);

      // Award XP to team members as well
      if (registration.isTeam()) {
        const members = await registration.getMembers();
        for (const member of members) {
          await member.addXP(xpPoints * 0.8, `Team Competition: ${registration.competition.title}`); // 80% of leader's XP
        }
      }

      res.json({
        success: true,
        message: 'Registration scored successfully',
        data: {
          registration: registration.toJSON(),
          xpAwarded: xpPoints
        }
      });

    } catch (error) {
      logger.error('Update registration score error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update registration score',
        error: error.message
      });
    }
  },

  // Add team member to registration
  addTeamMember: async (req, res) => {
    try {
      const { id } = req.params;
      const { member_email } = req.body;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'max_team_size']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id'],
            through: { attributes: [] }
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Check if user is the leader
      if (registration.leader_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can add members'
        });
      }

      // Check if it's a team registration
      if (!registration.isTeam()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add members to individual registration'
        });
      }

      // Check team size limit
      const currentTeamSize = 1 + (registration.teamMembers?.length || 0); // 1 for leader + current members
      if (currentTeamSize >= registration.competition.max_team_size) {
        return res.status(400).json({
          success: false,
          message: 'Team size limit reached'
        });
      }

      // Find the user to add
      const newMember = await User.findOne({ where: { email: member_email } });
      if (!newMember) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already a member or leader
      const isAlreadyMember = (registration.teamMembers || [])
        .some(member => member.id === newMember.id);
      if (newMember.id === registration.leader_id || isAlreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already part of this team'
        });
      }

      // Add member to registration
      await registration.addTeamMember([newMember]);

      // Reload registration with updated members
      const updatedRegistration = await Registration.findByPk(id, {
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] }
          },
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title']
          }
        ]
      });

      try {
  const compTitle = updatedRegistration.competition.title;
  const teamName = updatedRegistration.team_name || 'Your Team';

  // notify the new member
  await emailService.sendAddedToTeamEmail(
    newMember.email,
    newMember.name,
    compTitle,
    teamName,
    { link: process.env.FRONTEND_BASE_URL
        ? `${process.env.FRONTEND_BASE_URL.replace(/\/$/, '')}/competitions`
        : undefined }
  );
} catch (emailError) {
  logger.error('Failed to email added member:', emailError);
}


      res.json({
        success: true,
        message: 'Team member added successfully',
        data: {
          registration: updatedRegistration.toJSON()
        }
      });

    } catch (error) {
      logger.error('Add team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add team member',
        error: error.message
      });
    }
  },

  // Remove team member from registration
  removeTeamMember: async (req, res) => {
    try {
      const { id, memberId } = req.params;

      const registration = await Registration.findByPk(id, {
        include: [
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] }
          }
        ]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Check if user is the leader
      if (registration.leader_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can remove members'
        });
      }

      // Find the member to remove
      const memberToRemove = (registration.teamMembers || [])
        .find(member => String(member.id) === String(memberId));
      if (!memberToRemove) {
        return res.status(404).json({
          success: false,
          message: 'Member not found in team'
        });
      }

      // Remove member from registration
      await registration.removeTeamMember([memberToRemove]);

      try {
  const comp = await registration.getCompetition({ attributes: ['title'] });
  const teamName = registration.team_name || 'Your Team';
  await emailService.sendRemovedFromTeamEmail(
    memberToRemove.email,
    memberToRemove.name,
    comp.title,
    teamName
  );
} catch (emailError) {
  logger.error('Failed to email removed member:', emailError);
}


      res.json({
        success: true,
        message: 'Team member removed successfully'
      });

    } catch (error) {
      logger.error('Remove team member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove team member',
        error: error.message
      });
    }
  },

  // Get registrations by competition (for leaderboard)
  getCompetitionLeaderboard: async (req, res) => {
    try {
      const { competitionId } = req.params;

      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      const leaderboard = await Registration.findAll({
        where: {
          competition_id: competitionId,
          score: { [Op.ne]: null }
        },
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'college', 'profile_pic_url']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'college', 'profile_pic_url'],
            through: { attributes: [] }
          }
        ],
        order: [
          ['score', 'DESC'],
          ['submitted_at', 'ASC']
        ],
        limit: 100
      });

      // Add rank to each entry
      const rankedLeaderboard = leaderboard.map((registration, index) => ({
        ...registration.toJSON(),
        rank: index + 1
      }));

      res.json({
        success: true,
        data: {
          competition: {
            id: competition.id,
            title: competition.title
          },
          leaderboard: rankedLeaderboard,
          totalEntries: leaderboard.length
        }
      });

    } catch (error) {
      logger.error('Get competition leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competition leaderboard',
        error: error.message
      });
    }
  }
};

module.exports = registrationController;