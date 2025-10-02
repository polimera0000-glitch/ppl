const { Submission, Competition, JudgingCriteria, Score, User, Registration } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const parseJSON = (txt, fallback) => {
  try { return JSON.parse(txt); } catch { return fallback; }
};

const computeFinal = async (submissionId) => {
  const rows = await Score.findAll({
    where: { submission_id: submissionId },
    include: [{ model: JudgingCriteria, as: 'criterion', attributes: ['weight'] }]
  });
  if (!rows.length) return null;
  let sumWeighted = 0, sumWeights = 0;
  for (const r of rows) {
    const w = Number(r.criterion?.weight || 1);
    sumWeighted += Number(r.score || 0) * w;
    sumWeights += w;
  }
  return sumWeights ? sumWeighted / sumWeights : null;
};

module.exports = {
  // User submits project
  async createSubmission(req, res) {
    try {
      const { competitionId } = req.params;
      const leader_id = req.user.id;
      const {
        title, summary, repo_url, drive_url, video_url, zip_url, attachments = []
      } = req.body;

      const comp = await Competition.findByPk(competitionId);
      if (!comp) return res.status(404).json({ success: false, message: 'Competition not found' });

      // Optional: verify registered
      const reg = await Registration.findOne({ where: { competition_id: competitionId, leader_id } });
      if (!reg) return res.status(400).json({ success: false, message: 'Register first to submit' });

      const created = await Submission.create({
        competition_id: competitionId,
        leader_id,
        team_name: reg.team_name || null,
        title,
        summary,
        repo_url,
        drive_url,
        video_url,
        zip_url,
        attachments_json: JSON.stringify(Array.isArray(attachments) ? attachments : [])
      });

      // Email: receipt to user
      try {
        const user = await User.findByPk(leader_id);
        await emailService.sendSubmissionReceivedEmail?.(
          user.email, user.name, comp.title, title
        );
      } catch (e) {
        logger.warn('sendSubmissionReceivedEmail failed:', e?.message || e);
      }

      res.status(201).json({ success: true, data: { submission: created } });
    } catch (e) {
      logger.error('createSubmission error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to submit' });
    }
  },

  // User: list my submissions
  async listMySubmissions(req, res) {
    try {
      const list = await Submission.findAll({
        where: { leader_id: req.user.id },
        include: [
          { 
            model: Competition, 
            as: 'competition', 
            attributes: ['id', 'title', 'description', 'sponsor', 'location', 'start_date', 'end_date', 'tags']
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email', 'phone', 'org', 'country']
          }
        ],
        order: [['created_at','DESC']]
      });
      
      // parse attachments and format data for FE
      const out = list.map(s => {
        const j = s.toJSON();
        return { 
          ...j, 
          attachments: parseJSON(j.attachments_json || '[]', []),
          user: j.leader // alias for consistency
        };
      });
      
      res.json({ success: true, data: { submissions: out } });
    } catch (e) {
      logger.error('listMySubmissions error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to load submissions' });
    }
  },

  // Admin/Judges: list all submissions for a competition
  async listCompetitionSubmissions(req, res) {
    try {
      const { competitionId } = req.params;
      
      const competition = await Competition.findByPk(competitionId);
      if (!competition) {
        return res.status(404).json({ success: false, message: 'Competition not found' });
      }

      const list = await Submission.findAll({
        where: { competition_id: competitionId },
        include: [
          { 
            model: User, 
            as: 'leader', 
            attributes: ['id', 'name', 'email', 'phone', 'org', 'country', 'profile_pic_url']
          },
          {
            model: Competition,
            as: 'competition',
            attributes: ['id', 'title', 'description', 'sponsor', 'location', 'start_date', 'end_date', 'tags']
          }
        ],
        order: [['created_at','DESC']]
      });

      // Format data for frontend consistency
      const out = list.map(s => {
        const j = s.toJSON();
        return {
          ...j,
          attachments: parseJSON(j.attachments_json || '[]', []),
          user: j.leader // alias for consistency
        };
      });

      res.json({ success: true, data: { submissions: out } });
    } catch (e) {
      logger.error('listCompetitionSubmissions error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to fetch submissions' });
    }
  },

  // Admin/Judges: get one
  async getSubmission(req, res) {
    try {
      const sub = await Submission.findByPk(req.params.id, {
        include: [
          { 
            model: Competition, 
            as: 'competition',
            attributes: ['id', 'title', 'description', 'sponsor', 'location', 'start_date', 'end_date', 'tags']
          },
          {
            model: User,
            as: 'leader',
            attributes: ['id', 'name', 'email', 'phone', 'org', 'country', 'profile_pic_url']
          },
          { 
            model: Score, 
            as: 'scores',
            include: [
              { model: User, as: 'judge', attributes: ['id','name'] },
              { model: JudgingCriteria, as: 'criterion' }
            ]
          }
        ]
      });
      
      if (!sub) return res.status(404).json({ success: false, message: 'Not found' });
      
      const formatted = {
        ...sub.toJSON(),
        attachments: parseJSON(sub.attachments_json || '[]', []),
        user: sub.leader // alias for consistency
      };
      
      res.json({ success: true, data: { submission: formatted } });
    } catch (e) {
      logger.error('getSubmission error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed' });
    }
  },

  // NEW: Update submission (for admin evaluation)
  async updateSubmission(req, res) {
    try {
      const { id } = req.params;
      const { status, final_score, feedback } = req.body;

      const submission = await Submission.findByPk(id);
      if (!submission) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (final_score !== undefined) updateData.final_score = final_score;
      if (feedback !== undefined) updateData.feedback = feedback;

      await submission.update(updateData);

      // Optional: Send email notification to user
      try {
        const submissionWithDetails = await Submission.findByPk(id, {
          include: [
            { model: User, as: 'leader', attributes: ['email', 'name'] },
            { model: Competition, as: 'competition', attributes: ['title'] }
          ]
        });

        if (submissionWithDetails?.leader?.email && status) {
          await emailService.sendSubmissionStatusEmail?.(
            submissionWithDetails.leader.email, 
            submissionWithDetails.leader.name, 
            submissionWithDetails.competition?.title, 
            submissionWithDetails.title, 
            status, 
            feedback || null
          );
        }
      } catch (e) {
        logger.warn('Email notification failed:', e?.message || e);
      }

      res.json({ success: true, message: 'Submission updated successfully' });
    } catch (e) {
      logger.error('updateSubmission error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to update submission' });
    }
  },

  // Admin/Judges: score
  async scoreSubmission(req, res) {
    try {
      const { id } = req.params; // submission id
      const judge_id = req.user.id;
      const { criterion_id, score, comment } = req.body;

      const upsert = await Score.upsert({
        submission_id: id, judge_id, criterion_id, score, comment
      }, { returning: true });

      const finalScore = await computeFinal(id);
      if (finalScore != null) {
        await Submission.update({ final_score: finalScore, status: 'under_review' }, { where: { id } });
      }

      res.json({ success: true, data: { score: upsert[0], final_score: finalScore }});
    } catch (e) {
      logger.error('scoreSubmission error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to save score' });
    }
  },

  // Admin: set status (shortlisted/winner/disqualified/…)
  async setStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;
      await Submission.update({ status, ...(feedback ? { feedback } : {}) }, { where: { id } });

      // Optional email to leader on status change
      try {
        const sub = await Submission.findByPk(id, { include: [{ model: User, as: 'leader' }, { model: Competition, as: 'competition' }] });
        if (sub?.leader?.email) {
          await emailService.sendSubmissionStatusEmail?.(
            sub.leader.email, sub.leader.name, sub.competition?.title, sub.title, status, feedback || null
          );
        }
      } catch (e) {
        logger.warn('sendSubmissionStatusEmail failed:', e?.message || e);
      }

      res.json({ success: true });
    } catch (e) {
      logger.error('setStatus error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to update status' });
    }
  },

  async publishResults(req, res) {
    try {
      const { competitionId } = req.params;
      await Submission.update(
        { status: 'published' },
        { where: { competition_id: competitionId, status: { [Op.in]: ['under_review','shortlisted','winner','not_winner'] } } }
      );

      // Notify leaders (optional but recommended)
      try {
        const list = await Submission.findAll({
          where: { competition_id: competitionId, status: 'published' },
          include: [{ model: User, as: 'leader', attributes: ['email','name'] }, { model: Competition, as: 'competition', attributes: ['title'] }]
        });
        for (const s of list) {
          if (s?.leader?.email) {
            await emailService.sendResultsPublishedEmail?.(s.leader.email, s.leader.name, s.competition?.title);
          }
        }
      } catch (e) {
        logger.warn('publish results emails failed:', e?.message || e);
      }

      res.json({ success: true, message: 'Results published' });
    } catch (e) {
      logger.error('publishResults error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed to publish' });
    }
  },

  async leaderboard(req, res) {
    try {
      const { competitionId } = req.params;
      const list = await Submission.findAll({
        where: { competition_id: competitionId, status: 'published' },
        attributes: ['id','title','team_name','final_score'],
        order: [['final_score','DESC']],
        limit: 50
      });
      res.json({ success: true, data: { leaderboard: list } });
    } catch (e) {
      logger.error('leaderboard error:', e);
      res.status(500).json({ success: false, message: e.message || 'Failed' });
    }
  }
};