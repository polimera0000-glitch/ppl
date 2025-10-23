// src/controllers/competitionController.js
const { sequelize, Competition, Registration, User, Submission } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

/* ----------------------------- helpers ------------------------------ */
const safeParseJSON = (val, fallback) => {
  try {
    if (val == null) return fallback;
    if (typeof val === 'string') return JSON.parse(val);
    return val; // already object/array
  } catch (_) {
    return fallback;
  }
};

const serializeJSONText = (val, fallbackStringified = 'null') => {
  try {
    if (val == null) return fallbackStringified;
    if (typeof val === 'string') {
      // If it's valid JSON text, keep it; otherwise wrap it
      try {
        JSON.parse(val);
        return val;
      } catch {
        return JSON.stringify(val);
      }
    }
    return JSON.stringify(val);
  } catch (_) {
    return fallbackStringified;
  }
};

const normalizeJSONBInput = (val, fallback = {}) => {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;         // already JSON
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
};

// Stages can be array of strings or objects. Always store as TEXT(JSON).
const normalizeStagesForStorage = (stages) => {
  if (stages == null) return '[]';
  if (typeof stages === 'string') {
    // if already JSON keep; else split by comma to array of strings
    try {
      JSON.parse(stages);
      return stages;
    } catch {
      const arr = stages
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return JSON.stringify(arr);
    }
  }
  if (Array.isArray(stages)) return JSON.stringify(stages);
  return JSON.stringify([stages]); // single value -> array
};

const parseCompetitionTextFields = (compJson) => ({
  ...compJson,
  stages: safeParseJSON(compJson.stages, []),
  eligibility_criteria: safeParseJSON(compJson.eligibility_criteria, {}),
  contact_info: safeParseJSON(compJson.contact_info, {}),
});

// Make sure newly added JSONB fields come out parsed in responses
const parseCompetitionStructuredFields = (c) => ({
  ...c,
  // keep your legacy parsers:
  stages: safeParseJSON(c.stages, []),
  eligibility_criteria: typeof c.eligibility_criteria === 'string'
    ? safeParseJSON(c.eligibility_criteria, {})
    : (c.eligibility_criteria ?? {}),
  contact_info: typeof c.contact_info === 'string'
    ? safeParseJSON(c.contact_info, {})
    : (c.contact_info ?? {}),

  // NEW structured fields (always return POJOs/arrays)
  team_limits: c.team_limits ?? {},
  submission_limits: c.submission_limits ?? {},
  evaluation: c.evaluation ?? {},
  code_requirements: c.code_requirements ?? {},
  external_data_policy: c.external_data_policy ?? {},
  winner_license: c.winner_license ?? {},
  data_access: c.data_access ?? {},
  prizes: c.prizes ?? [],
  resources: c.resources ?? [],
});

/* --------------------------- controller ----------------------------- */
const competitionController = {
  // Get all competitions
  getAllCompetitions: async (req, res) => {
    try {
      const currentUserId = req.user?.id ?? null;
      const {
        page = 1,
        limit = 20,
        is_active = 'true',
        search,
        upcoming,
        ongoing,
        past
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (is_active !== 'all') whereClause.is_active = is_active === 'true';

      const now = new Date();
      if (upcoming === 'true') {
        whereClause.start_date = { [Op.gt]: now };
      } else if (ongoing === 'true') {
        whereClause.start_date = { [Op.lte]: now };
        whereClause.end_date = { [Op.gt]: now };
      } else if (past === 'true') {
        whereClause.end_date = { [Op.lt]: now };
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { sponsor: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { rows: competitions, count } = await Competition.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Registration,
            as: 'registrations',
            attributes: ['id', 'type', 'status', 'leader_id'],
            required: false
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email', 'college', 'profile_pic_url'],
            required: false
          },
          // Include submissions to check if user has submitted
          {
            model: Submission,
            as: 'submissions',
            attributes: ['id', 'leader_id', 'status', 'title'],
            required: false
          }
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['start_date', 'ASC']],
        distinct: true
      });

      // const competitionsWithStats = competitions.map(comp => {
      //   const compData = parseCompetitionTextFields(comp.toJSON());
      //   const totalRegistrations = compData.registrations?.length || 0;
      //   const confirmedRegistrations =
      //     compData.registrations?.filter(r => r.status === 'confirmed')?.length || 0;

      //   const postedBy = compData.createdBy
      //     ? {
      //         id: compData.createdBy.id,
      //         name: compData.createdBy.name,
      //         email: compData.createdBy.email,
      //         profile_pic_url: compData.createdBy.profile_pic_url
      //       }
      //     : null;

      //   // Check if current user has registered
      //   const user_registered = !!(
      //     currentUserId &&
      //     compData.registrations?.some(r => String(r.leader_id) === String(currentUserId))
      //   );

      //   // Check if current user has submitted
      //   const user_submitted = !!(
      //     currentUserId &&
      //     compData.submissions?.some(s => String(s.leader_id) === String(currentUserId))
      //   );

      //   // Clean up submissions data (don't send full list to frontend for privacy)
      //   const { submissions, ...compDataWithoutSubmissions } = compData;

      //   return {
      //     ...compDataWithoutSubmissions,
      //     posted_by: postedBy, // backward compatible for Flutter
      //     createdBy: compData.createdBy,
      //     user_registered,
      //     user_submitted,
      //     stats: {
      //       totalRegistrations,
      //       confirmedRegistrations,
      //       seatsRemaining: comp.seats_remaining,
      //       totalSubmissions: submissions?.length || 0
      //     }
      //   };
      // });

      const competitionsWithStats = competitions.map(comp => {
  const compData = parseCompetitionStructuredFields(comp.toJSON());

  const totalRegistrations = compData.registrations?.length || 0;
  const confirmedRegistrations =
    compData.registrations?.filter(r => r.status === 'confirmed')?.length || 0;

  const postedBy = compData.createdBy
    ? {
        id: compData.createdBy.id,
        name: compData.createdBy.name,
        email: compData.createdBy.email,
        profile_pic_url: compData.createdBy.profile_pic_url
      }
    : null;

  const user_registered = !!(
    currentUserId &&
    compData.registrations?.some(r => String(r.leader_id) === String(currentUserId))
  );

  const user_submitted = !!(
    currentUserId &&
    compData.submissions?.some(s => String(s.leader_id) === String(currentUserId))
  );

  const { submissions, ...compDataWithoutSubmissions } = compData;

  return {
    ...compDataWithoutSubmissions,
    posted_by: postedBy,
    createdBy: compData.createdBy,
    user_registered,
    user_submitted,
    stats: {
      totalRegistrations,
      confirmedRegistrations,
      seatsRemaining: comp.seats_remaining,
      totalSubmissions: submissions?.length || 0
    }
  };
});


      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          competitions: competitionsWithStats,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalCompetitions: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all competitions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competitions',
        error: error.message
      });
    }
  },

  // Get competition by ID
  getCompetitionById: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id ?? null;

      const competition = await Competition.findByPk(id, {
        include: [
          {
            model: Registration,
            as: 'registrations',
            include: [
              {
                model: User,
                as: 'leader',
                attributes: ['id', 'name', 'email', 'college', 'profile_pic_url']
              },
              {
                model: User,
                as: 'teamMembers',
                attributes: ['id', 'name', 'email', 'college', 'profile_pic_url'],
                through: { attributes: [] }
              }
            ]
          },
          {
            model: User,
            as: 'createdBy',
            attributes: ['id', 'name', 'email', 'college', 'profile_pic_url'],
            required: false
          },
          {
            model: Submission,
            as: 'submissions',
            attributes: ['id', 'leader_id', 'status', 'title'],
            required: false
          }
        ]
      });

      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // const competitionData = parseCompetitionTextFields(competition.toJSON());
      const competitionData = parseCompetitionStructuredFields(competition.toJSON());

      const totalRegistrations = competitionData.registrations?.length || 0;
      const confirmedRegistrations =
        competitionData.registrations?.filter(r => r.status === 'confirmed')?.length || 0;

      // Check user status and get detailed registration info
      let user_registered = false;
      let user_registration = null;

      if (currentUserId) {
        const userRegistration = competitionData.registrations?.find(r => 
          String(r.leader_id) === String(currentUserId) ||
          r.teamMembers?.some(member => String(member.id) === String(currentUserId))
        );

        if (userRegistration) {
          user_registered = true;
          user_registration = {
            id: userRegistration.id,
            type: userRegistration.type,
            status: userRegistration.status,
            teamName: userRegistration.team_name,
            isLeader: String(userRegistration.leader_id) === String(currentUserId),
            registeredAt: userRegistration.created_at,
            invitationStatus: userRegistration.invitation_status
          };
        }
      }

      const user_submitted = !!(
        currentUserId &&
        competitionData.submissions?.some(s => String(s.leader_id) === String(currentUserId))
      );

      const stats = {
        totalRegistrations,
        confirmedRegistrations,
        seatsRemaining: competition.seats_remaining,
        totalSubmissions: competitionData.submissions?.length || 0,
        isUpcoming: new Date() < new Date(competition.start_date),
        isOngoing:
          new Date() >= new Date(competition.start_date) &&
          new Date() <= new Date(competition.end_date),
        isPast: new Date() > new Date(competition.end_date)
      };

      const postedBy = competitionData.createdBy
        ? {
            id: competitionData.createdBy.id,
            name: competitionData.createdBy.name,
            email: competitionData.createdBy.email,
            profile_pic_url: competitionData.createdBy.profile_pic_url
          }
        : null;

      // Remove submissions from response for privacy (only show stats)
      const { submissions, ...responseData } = competitionData;

      res.json({
        success: true,
        data: {
          competition: {
            ...responseData,
            posted_by: postedBy,
            createdBy: competitionData.createdBy,
            user_registered,
            user_registration,
            user_submitted,
            stats
          }
        }
      });
    } catch (error) {
      logger.error('Get competition by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competition',
        error: error.message
      });
    }
  },

  // Create new competition (admin only)
  createCompetition: async (req, res) => {
    try {
      const {
        title,
        description,
        sponsor,
        start_date,
        end_date,
        max_team_size = 1,
        seats_remaining = 100,
        total_seats: total_seats_body,
        totalSeats: totalSeatsBody,
        stages = ['registration', 'submission', 'evaluation'],
        tags = [],
        eligibility_criteria,
        contact_info,
        banner_image_url,
        location,

        // NEW fields
  description_long,
  rules,                // keep old freeform rules if provided
  rules_markdown,
  registration_start_date,
  registration_deadline, // you already had this
  results_date,
  prizes,
  resources,
  team_limits,
  submission_limits,
  evaluation,
  code_requirements,
  external_data_policy,
  winner_license,
  data_access
      } = req.body;

      // Validation
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Competition title is required'
        });
      }

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      // Decide totals
const totalSeatsInt = parseInt(
  total_seats_body ?? totalSeatsBody ?? seats_remaining,
  10
);
const seatsRemainingInt = parseInt(
  seats_remaining ?? totalSeatsInt ?? 100,
  10
);

      const payload = {
        title: title.trim(),
        description: description?.trim() || null,
        sponsor: sponsor?.trim() || null,
        start_date,
        end_date,
        max_team_size: parseInt(max_team_size, 10),
        total_seats: Number.isFinite(totalSeatsInt) ? totalSeatsInt : 100,
  seats_remaining: Number.isFinite(seatsRemainingInt)
    ? seatsRemainingInt
    : (Number.isFinite(totalSeatsInt) ? totalSeatsInt : 100),
        created_by: req.user.id, // Set the creator
        banner_image_url: banner_image_url?.trim() || null,
        location: location?.trim() || null,
        // TEXT fields
        stages: normalizeStagesForStorage(stages),
        tags: Array.isArray(tags) ? tags : [],
        eligibility_criteria: serializeJSONText(eligibility_criteria, '{}'),
        contact_info: serializeJSONText(contact_info, '{}'),

        // NEW fields
  description_long: description_long ?? null,
  rules: rules ?? null,
  rules_markdown: rules_markdown ?? null,

  registration_start_date: registration_start_date ?? null,
  registration_deadline: registration_deadline ?? null,
  results_date: results_date ?? null,

  prizes: Array.isArray(prizes) ? prizes : [],
  resources: Array.isArray(resources) ? resources : [],

  team_limits: normalizeJSONBInput(team_limits, {}),
  submission_limits: normalizeJSONBInput(submission_limits, {}),
  evaluation: normalizeJSONBInput(evaluation, {}),
  code_requirements: normalizeJSONBInput(code_requirements, {}),
  external_data_policy: normalizeJSONBInput(external_data_policy, {}),
  winner_license: normalizeJSONBInput(winner_license, {}),
  data_access: normalizeJSONBInput(data_access, {})
      };

      const competition = await Competition.create(payload);
      // const out = parseCompetitionTextFields(competition.toJSON());
      const out = parseCompetitionStructuredFields(competition.toJSON());

      res.status(201).json({
        success: true,
        message: 'Competition created successfully',
        data: { competition: out }
      });
    } catch (error) {
      logger.error('Create competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create competition',
        error: error.message
      });
    }
  },

  // Update competition (admin only)
  updateCompetition: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const competition = await Competition.findByPk(id);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Only allow creator or admin to update
      const isCreator = String(competition.created_by) === String(req.user.id);
      const isAdmin = req.user.role?.toLowerCase() === 'admin';
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only update competitions you created'
        });
      }

      // Validation for date updates
      if (updateData.start_date || updateData.end_date) {
        const startDate = new Date(updateData.start_date || competition.start_date);
        const endDate = new Date(updateData.end_date || competition.end_date);
        
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: 'Start date must be before end date'
          });
        }
      }

      // Serialize TEXT fields when provided
      if (Object.prototype.hasOwnProperty.call(updateData, 'stages')) {
        updateData.stages = normalizeStagesForStorage(updateData.stages);
      }

      // Normalize JSONB to POJO
const jsonbKeys = [
  'eligibility_criteria',
  'contact_info',
  'team_limits',
  'submission_limits',
  'evaluation',
  'code_requirements',
  'external_data_policy',
  'winner_license',
  'data_access'
];
jsonbKeys.forEach((k) => {
  if (Object.prototype.hasOwnProperty.call(updateData, k)) {
    updateData[k] = normalizeJSONBInput(updateData[k], Array.isArray(Competition.rawAttributes[k]?.type?.key) ? [] : {});
  }
});

      if (Object.prototype.hasOwnProperty.call(updateData, 'eligibility_criteria')) {
        updateData.eligibility_criteria = serializeJSONText(updateData.eligibility_criteria, '{}');
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'contact_info')) {
        updateData.contact_info = serializeJSONText(updateData.contact_info, '{}');
      }

      // Arrays
if (Object.prototype.hasOwnProperty.call(updateData, 'tags') && typeof updateData.tags === 'string') {
  try { updateData.tags = JSON.parse(updateData.tags); } catch { updateData.tags = []; }
}
if (Object.prototype.hasOwnProperty.call(updateData, 'prizes') && typeof updateData.prizes === 'string') {
  try { updateData.prizes = JSON.parse(updateData.prizes); } catch { updateData.prizes = []; }
}
if (Object.prototype.hasOwnProperty.call(updateData, 'resources') && typeof updateData.resources === 'string') {
  try { updateData.resources = JSON.parse(updateData.resources); } catch { updateData.resources = []; }
}

      // Clean up string fields
      if (updateData.title) updateData.title = updateData.title.trim();
      if (updateData.description) updateData.description = updateData.description.trim();
      if (updateData.sponsor) updateData.sponsor = updateData.sponsor.trim();
      if (updateData.location) updateData.location = updateData.location.trim();
      if (updateData.banner_image_url) updateData.banner_image_url = updateData.banner_image_url.trim();

      // Trim simple strings
['title','description','sponsor','location','banner_image_url','description_long','rules','rules_markdown']
  .forEach(k => { if (typeof updateData[k] === 'string') updateData[k] = updateData[k].trim(); });

      await competition.update(updateData);
      // const out = parseCompetitionTextFields(competition.toJSON());
      const out = parseCompetitionStructuredFields(competition.toJSON());

      if (Object.prototype.hasOwnProperty.call(updateData, 'total_seats')) {
  const newTotal = parseInt(updateData.total_seats, 10);
  if (!Number.isFinite(newTotal) || newTotal < 0) {
    return res.status(400).json({ success: false, message: 'total_seats must be a non-negative integer' });
  }
  // If seats_remaining is not provided, keep it unchanged,
  // but ensure it doesn’t exceed new total.
  if (!Object.prototype.hasOwnProperty.call(updateData, 'seats_remaining')) {
    updateData.seats_remaining = Math.min(competition.seats_remaining, newTotal);
  } else {
    const newRemaining = parseInt(updateData.seats_remaining, 10);
    if (newRemaining > newTotal) {
      return res.status(400).json({ success: false, message: 'seats_remaining cannot exceed total_seats' });
    }
  }
}

      res.json({
        success: true,
        message: 'Competition updated successfully',
        data: { competition: out }
      });
    } catch (error) {
      logger.error('Update competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update competition',
        error: error.message
      });
    }
  },

  // Delete competition (admin only)
  deleteCompetition: async (req, res) => {
    try {
      const { id } = req.params;

      const competition = await Competition.findByPk(id);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Only allow creator or admin to delete
      const isCreator = String(competition.created_by) === String(req.user.id);
      const isAdmin = req.user.role?.toLowerCase() === 'admin';
      
      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete competitions you created'
        });
      }

      // Check for existing registrations
      const registrationCount = await Registration.count({
        where: { competition_id: id }
      });

      if (registrationCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete competition with existing registrations'
        });
      }

      // Check for existing submissions
      const submissionCount = await Submission.count({
        where: { competition_id: id }
      });

      if (submissionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete competition with existing submissions'
        });
      }

      await competition.destroy();

      res.json({
        success: true,
        message: 'Competition deleted successfully'
      });
    } catch (error) {
      logger.error('Delete competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete competition',
        error: error.message
      });
    }
  },

  // Register for competition
  registerForCompetition: async (req, res) => {
    try {
      const { id: competitionId } = req.params;
      const { type = 'individual', team_name, member_emails = [], members = [], abstract } = req.body;
      const userId = req.user.id;

      // Handle both frontend formats - extract emails from members array if provided
      let teamMemberEmails = member_emails;
      if (members && members.length > 0 && teamMemberEmails.length === 0) {
        teamMemberEmails = members.map(member => member.email).filter(email => email);
      }

      // Debug logging
      logger.info('Registration attempt:', {
        competitionId,
        type,
        team_name,
        member_emails: teamMemberEmails,
        userId,
        originalMemberEmails: member_emails,
        membersArray: members,
        extractedEmails: teamMemberEmails
      });

      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Check if competition is active
      if (!competition.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Competition is not active'
        });
      }

      // Check if registration is still open
      const now = new Date();
      if (now > new Date(competition.end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Competition registration has ended'
        });
      }

      // Check if user already registered
      const existingRegistration = await Registration.checkUserRegistration(competitionId, userId);
      if (existingRegistration) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this competition'
        });
      }

      // Check seats availability
      if (competition.seats_remaining <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No seats remaining for this competition'
        });
      }

      // Validate team size
      const totalMembers = 1 + member_emails.length; // 1 for leader + members
      if (totalMembers > competition.max_team_size) {
        return res.status(400).json({
          success: false,
          message: `Team size cannot exceed ${competition.max_team_size} members`
        });
      }

      // Handle individual registration
      if (type === 'individual') {
        // Create individual registration
        const registration = await Registration.create({
          competition_id: competitionId,
          leader_id: userId,
          type: 'individual',
          team_name: null,
          abstract: abstract?.trim() || null,
          status: 'confirmed',
          invitation_status: 'complete'
        });

        // Update seats remaining
        await competition.update({
          seats_remaining: competition.seats_remaining - 1
        });

        // Send confirmation email
        try {
          const user = await User.findByPk(userId);
          await emailService.sendCompetitionRegistrationEmail(
            user.email,
            user.name,
            competition.title
          );
        } catch (emailError) {
          logger.warn('Registration email failed:', emailError.message);
        }

        // Load registration with associations for response
        const registrationWithDetails = await Registration.findByPk(registration.id, {
          include: [
            {
              model: User,
              as: 'leader',
              attributes: ['id', 'name', 'email']
            },
            {
              model: Competition,
              as: 'competition',
              attributes: ['id', 'title', 'start_date', 'end_date']
            }
          ]
        });

        return res.status(201).json({
          success: true,
          message: 'Individual registration successful',
          data: {
            registration: registrationWithDetails.toJSON()
          }
        });
      }

      // Handle team registration with invitation system
      if (type === 'team') {
        // Validate team name
        if (!team_name || team_name.trim().length < 3) {
          return res.status(400).json({
            success: false,
            message: 'Team name must be at least 3 characters long'
          });
        }

        // Validate member emails
        if (!teamMemberEmails || teamMemberEmails.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one team member email is required for team registration'
          });
        }

        // Create team registration with pending invitation status
        const registration = await Registration.create({
          competition_id: competitionId,
          leader_id: userId,
          type: 'team',
          team_name: team_name.trim(),
          abstract: abstract?.trim() || null,
          status: 'pending', // Keep as pending until invitations are resolved
          invitation_status: 'pending_invitations'
        });

        // Send team invitations using the invitation service
        try {
          const invitationService = require('../services/invitationService');
          const invitationResult = await invitationService.sendBatchInvitations(
            registration,
            teamMemberEmails,
            userId
          );

          logger.info(`Team registration created with ${invitationResult.successful} invitations sent`);

          // Load registration with associations for response
          const registrationWithDetails = await Registration.findByPk(registration.id, {
            include: [
              {
                model: User,
                as: 'leader',
                attributes: ['id', 'name', 'email']
              },
              {
                model: Competition,
                as: 'competition',
                attributes: ['id', 'title', 'start_date', 'end_date']
              }
            ]
          });

          return res.status(201).json({
            success: true,
            message: `Team registration created. ${invitationResult.successful} invitations sent successfully.`,
            data: {
              registration: registrationWithDetails.toJSON(),
              invitations: {
                sent: invitationResult.successful,
                failed: invitationResult.failed,
                total: teamMemberEmails.length
              }
            }
          });

        } catch (invitationError) {
          logger.error('Error sending team invitations:', invitationError.message);
          
          // If invitation sending fails, we should still create the registration
          // but inform the user about the issue
          const registrationWithDetails = await Registration.findByPk(registration.id, {
            include: [
              {
                model: User,
                as: 'leader',
                attributes: ['id', 'name', 'email']
              },
              {
                model: Competition,
                as: 'competition',
                attributes: ['id', 'title', 'start_date', 'end_date']
              }
            ]
          });

          return res.status(201).json({
            success: true,
            message: 'Team registration created, but there was an issue sending invitations. You can resend them from your dashboard.',
            data: {
              registration: registrationWithDetails.toJSON(),
              invitations: {
                sent: 0,
                failed: teamMemberEmails.length,
                total: teamMemberEmails.length,
                error: invitationError.message
              }
            }
          });
        }
      }

    } catch (error) {
      logger.error('Register for competition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register for competition',
        error: error.message
      });
    }
  },

  // Complete team registration when all invitations are resolved
  completeTeamRegistration: async (req, res) => {
    try {
      const { registrationId } = req.params;
      const userId = req.user.id;

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
          message: 'Registration not found'
        });
      }

      // Check if user is the team leader
      if (registration.leader_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only team leaders can complete registrations'
        });
      }

      // Check if registration is a team registration
      if (registration.type !== 'team') {
        return res.status(400).json({
          success: false,
          message: 'Only team registrations can be completed'
        });
      }

      // Check if registration is still pending
      if (registration.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Registration is not in pending status'
        });
      }

      // Check if all invitations are resolved
      const areAllResolved = await registration.areAllInvitationsResolved();
      if (!areAllResolved) {
        return res.status(400).json({
          success: false,
          message: 'Cannot complete registration while invitations are still pending'
        });
      }

      // Get accepted invitations to add members
      const acceptedInvitations = await registration.getAcceptedInvitations();
      
      // Add accepted members to the team
      for (const invitation of acceptedInvitations) {
        if (invitation.invitee_id) {
          await registration.addMemberFromInvitation(invitation.invitee_id);
        }
      }

      // Check if we have enough seats
      const competition = registration.competition;
      if (competition.seats_remaining <= 0) {
        return res.status(400).json({
          success: false,
          message: 'No seats remaining for this competition'
        });
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
        const user = registration.leader;
        await emailService.sendCompetitionRegistrationEmail(
          user.email,
          user.name,
          competition.title
        );
      } catch (emailError) {
        logger.warn('Registration confirmation email failed:', emailError.message);
      }

      // Load updated registration with team members
      const updatedRegistration = await Registration.findByPk(registration.id, {
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
            attributes: ['id', 'title', 'start_date', 'end_date']
          }
        ]
      });

      logger.info(`Team registration ${registrationId} completed by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Team registration completed successfully',
        data: {
          registration: updatedRegistration.toJSON(),
          team_size: updatedRegistration.getTeamSize()
        }
      });

    } catch (error) {
      logger.error('Complete team registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete team registration',
        error: error.message
      });
    }
  },

  // Get user's registration status for a specific competition
  getRegistrationStatus: async (req, res) => {
    try {
      const { id: competitionId } = req.params;
      const userId = req.user.id;

      // Find the competition
      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      // Check if user is registered for this competition
      const registration = await Registration.checkUserRegistration(competitionId, userId);

      if (!registration) {
        return res.json({
          success: true,
          data: {
            isRegistered: false,
            competition: {
              id: competition.id,
              title: competition.title,
              maxTeamSize: competition.max_team_size,
              seatsRemaining: competition.seats_remaining
            },
            permissions: {
              canRegister: competition.canUserRegister(),
              canRegisterIndividual: true,
              canRegisterTeam: competition.max_team_size > 1
            }
          }
        });
      }

      // Load registration with full details
      const fullRegistration = await Registration.findByPk(registration.id, {
        include: [
          { model: User, as: 'leader', attributes: ['id', 'name', 'email'] },
          { model: Competition, as: 'competition', attributes: ['id', 'title', 'max_team_size'] }
        ]
      });

      const responseData = {
        isRegistered: true,
        registration: {
          id: fullRegistration.id,
          type: fullRegistration.type,
          status: fullRegistration.status,
          teamName: fullRegistration.team_name,
          registeredAt: fullRegistration.created_at,
          invitationStatus: fullRegistration.invitation_status
        },
        permissions: {
          canWithdraw: fullRegistration.status === 'pending' || fullRegistration.status === 'confirmed',
          canManageTeam: fullRegistration.leader_id === userId && fullRegistration.type === 'team',
          canInviteMembers: fullRegistration.leader_id === userId && 
                           fullRegistration.type === 'team' && 
                           fullRegistration.getTeamSize() < competition.max_team_size
        }
      };

      // Add team details if it's a team registration
      if (fullRegistration.type === 'team') {
        try {
          const invitationService = require('../services/invitationService');
          const invitationData = await invitationService.getInvitationStatus(fullRegistration.id);

          responseData.team = {
            name: fullRegistration.team_name,
            leader: fullRegistration.leader,
            currentSize: fullRegistration.getTeamSize(),
            maxSize: competition.max_team_size,
            invitationStatus: fullRegistration.invitation_status
          };

          responseData.invitations = invitationData.invitations.map(invitation => ({
            id: invitation.id,
            email: invitation.invitee_email,
            inviteeName: invitation.invitee ? invitation.invitee.name : null,
            status: invitation.status,
            sentAt: invitation.created_at,
            expiresAt: invitation.expires_at,
            respondedAt: invitation.responded_at,
            isExpired: invitation.isExpired(),
            canResend: invitation.status === 'pending' && !invitation.isExpired()
          }));

          responseData.invitationSummary = {
            total: invitationData.totalInvitations,
            pending: invitationData.statusCounts.pending,
            accepted: invitationData.statusCounts.accepted,
            rejected: invitationData.statusCounts.rejected,
            expired: invitationData.statusCounts.expired,
            isComplete: invitationData.isComplete
          };

        } catch (invitationError) {
          logger.warn('Failed to load invitation data for registration status:', invitationError.message);
          // Don't fail the request, just omit invitation data
        }
      }

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      logger.error('Get registration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get registration status',
        error: error.message
      });
    }
  },

  // Get complete user context for competition page
  getUserContext: async (req, res) => {
    try {
      const { id: competitionId } = req.params;
      const userId = req.user.id;

      // Get registration status
      const registrationStatusResponse = await competitionController.getRegistrationStatus(
        { params: { id: competitionId }, user: { id: userId } },
        { json: (data) => data } // Mock response object
      );

      // Get user's received invitations for this competition
      const { TeamInvitation } = require('../models');
      const receivedInvitations = await TeamInvitation.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { invitee_id: userId },
            { invitee_email: req.user.email }
          ]
        },
        include: [
          {
            model: Registration,
            as: 'registration',
            where: { competition_id: competitionId },
            include: [
              { model: User, as: 'leader', attributes: ['name', 'email'] },
              { model: Competition, as: 'competition', attributes: ['title'] }
            ]
          }
        ]
      });

      const contextData = {
        ...registrationStatusResponse.data,
        receivedInvitations: receivedInvitations.map(inv => ({
          id: inv.id,
          token: inv.token,
          teamName: inv.registration.team_name,
          teamLeader: inv.registration.leader,
          competition: inv.registration.competition,
          status: inv.status,
          expiresAt: inv.expires_at,
          isExpired: inv.isExpired(),
          canRespond: inv.canRespond()
        }))
      };

      res.json({
        success: true,
        data: contextData
      });

    } catch (error) {
      logger.error('Get user context error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user context',
        error: error.message
      });
    }
  },

  // Get user's registrations
  getUserRegistrations: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        [Op.or]: [
          { leader_id: userId },
          { '$teamMembers.id$': userId }
        ]
      };

      if (status) whereClause.status = status;

      const { rows: registrations, count } = await Registration.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'start_date', 'end_date', 'sponsor', 'location']
          },
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
          }
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['created_at', 'DESC']],
        distinct: true
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          registrations,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalRegistrations: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get user registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registrations',
        error: error.message
      });
    }
  },

  // Cancel registration
  cancelRegistration: async (req, res) => {
    try {
      const { registrationId } = req.params;
      const userId = req.user.id;

      const registration = await Registration.findByPk(registrationId, {
        include: [{ model: Competition, as: 'competition' }]
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      // Only leader can cancel registration
      if (registration.leader_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can cancel registration'
        });
      }

      // Check if competition hasn't started yet
      if (new Date() >= new Date(registration.competition.start_date)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel registration after competition has started'
        });
      }

      // Check if user has already submitted
      const existingSubmission = await Submission.findOne({
        where: { 
          competition_id: registration.competition_id,
          leader_id: userId
        }
      });

      if (existingSubmission) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel registration after submitting project'
        });
      }

      // Update competition seats back
      await registration.competition.update({
        seats_remaining: registration.competition.seats_remaining + 1
      });

      await registration.destroy();

      res.json({
        success: true,
        message: 'Registration cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel registration',
        error: error.message
      });
    }
  },

  // Get competition registrations (admin/hiring/investor only)
  getCompetitionRegistrations: async (req, res) => {
    try {
      const { id: competitionId } = req.params;
      const { status, page = 1, limit = 50 } = req.query;

      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({
          success: false,
          message: 'Competition not found'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = { competition_id: competitionId };
      if (status) whereClause.status = status;

      const { rows: registrations, count } = await Registration.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email', 'college', 'branch', 'year', 'phone']
          },
          {
            model: User,
            as: 'teamMembers',
            attributes: ['id', 'name', 'email', 'college', 'branch', 'year', 'phone'],
            through: { attributes: [] }
          }
        ],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          competition: {
            id: competition.id,
            title: competition.title,
            start_date: competition.start_date,
            end_date: competition.end_date
          },
          registrations,
          pagination: {
            currentPage: parseInt(page, 10),
            totalPages,
            totalRegistrations: count,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get competition registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch competition registrations',
        error: error.message
      });
    }
  },

  // Add these methods to competitionController

// Get competition leaderboard (public results)
getCompetitionLeaderboard: async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByPk(id);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Get all submissions with published results, ordered by score
    const submissions = await Submission.findAll({
      where: {
        competition_id: id,
        status: { [Op.in]: ['published', 'winner', 'shortlisted'] },
        final_score: { [Op.ne]: null }
      },
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'name', 'email', 'profile_pic_url', 'college']
        }
      ],
      order: [['final_score', 'DESC']],
      limit: 100
    });

    // Format with ranks
    const leaderboard = submissions.map((sub, index) => {
      const data = sub.toJSON();
      return {
        ...data,
        rank: index + 1,
        attachments: safeParseJSON(data.attachments_json, [])
      };
    });

    res.json({
      success: true,
      data: {
        competition: {
          id: competition.id,
          title: competition.title,
          sponsor: competition.sponsor,
          location: competition.location,
          start_date: competition.start_date,
          end_date: competition.end_date,
          results_date: competition.results_date,
  prizes: competition.prizes
        },
        leaderboard,
        totalEntries: submissions.length
      }
    });
  } catch (error) {
    logger.error('Get competition leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
},

// Get registration stats for admin
getRegistrationStats: async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findByPk(id);
    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    // Get registration counts
    const totalRegistrations = await Registration.count({
      where: { competition_id: id }
    });

    const registrationsByStatus = await Registration.findAll({
      where: { competition_id: id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Get submission counts
    const totalSubmissions = await Submission.count({
      where: { competition_id: id }
    });

    const submissionsByStatus = await Submission.findAll({
      where: { competition_id: id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        competition: {
          id: competition.id,
          title: competition.title
        },
        registrations: {
          total: totalRegistrations,
          byStatus: registrationsByStatus.map(r => ({
            status: r.status,
            count: parseInt(r.dataValues.count)
          }))
        },
        submissions: {
          total: totalSubmissions,
          byStatus: submissionsByStatus.map(s => ({
            status: s.status,
            count: parseInt(s.dataValues.count)
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Get registration stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
}
};

module.exports = competitionController;