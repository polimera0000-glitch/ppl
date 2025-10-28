const { ContactRequest, User, Submission } = require('../models');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const contactController = {
  // Create a contact request (hiring/investor/admin → student)
  create: async (req, res) => {
    try {
      const { subject, message, recipient_id, submission_id, contact_email, contact_phone } = req.body;
      const me = req.user; // from auth middleware

      if (!['hiring','investor','admin'].includes(me.role)) {
        return res.status(403).json({ success: false, message: 'Only hiring/investor/admin can contact students' });
      }
      if (!recipient_id || !subject || !message) {
        return res.status(400).json({ success: false, message: 'recipient_id, subject, and message are required' });
      }

      const recipient = await User.findByPk(recipient_id);
      if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

      if (recipient.role !== 'student') {
        return res.status(400).json({ success: false, message: 'Recipient must be a student' });
      }

      // Optional: ensure submission belongs to recipient if provided
      if (submission_id && Submission) {
        const sub = await Submission.findByPk(submission_id);
        if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
        if (sub.user_id !== recipient.id) {
          return res.status(400).json({ success: false, message: 'Submission does not belong to that student' });
        }
      }

      const payload = {
        sender_id: me.id,
        sender_role: me.role,
        recipient_id,
        submission_id: submission_id || null,
        subject: subject.trim(),
        message: message.trim(),
        contact_email: contact_email || me.email,
        contact_phone: contact_phone || null,
        sender_company_name: me.company_name || null,
        sender_firm_name: me.firm_name || null,
      };

      const cr = await ContactRequest.create(payload);

      // Send email notifications (non-blocking)
      try {
        // Send notification to student
        await emailService.sendContactNotificationEmail(
          recipient.email,
          recipient.name,
          me.name,
          me.role,
          subject.trim(),
          message.trim(),
          contact_email || me.email
        );

        // Send confirmation to sender
        await emailService.sendContactConfirmationEmail(
          me.email,
          me.name,
          recipient.name,
          subject.trim()
        );

        logger.info('Contact emails sent successfully', {
          sender: me.name,
          recipient: recipient.name,
          subject: subject.trim()
        });
      } catch (emailError) {
        // Log email error but don't fail the request
        logger.warn('Contact email failed (request still created)', {
          error: emailError.message,
          sender: me.name,
          recipient: recipient.name
        });
      }

      return res.status(201).json({ success: true, data: cr });
    } catch (err) {
      console.error('Contact create error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create contact request' });
    }
  },

  // Inbox/Sent list
  list: async (req, res) => {
    try {
      const box = (req.query.box || 'inbox').toLowerCase(); // inbox | sent
      const where = box === 'sent' ? { sender_id: req.user.id } : { recipient_id: req.user.id };

      const rows = await ContactRequest.findAll({
        where,
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'sender', attributes: ['id','name','role','company_name','firm_name'] },
          { model: User, as: 'recipient', attributes: ['id','name','role','email','college','branch','year','college_name','branch_name','year_of_study'] },
          Submission ? { model: Submission, as: 'submission', attributes: ['id','title','competition_id'] } : null,
        ].filter(Boolean),
      });

      return res.json({ success: true, data: rows });
    } catch (err) {
      console.error('Contact list error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch contact requests' });
    }
  },

  // Update status (student -> approve/reject/close)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, seen } = req.body;

      const cr = await ContactRequest.findByPk(id);
      if (!cr) return res.status(404).json({ success: false, message: 'Contact request not found' });

      // Only recipient can change status; either party can mark seen
      if (status) {
        if (cr.recipient_id !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Only the recipient can change status' });
        }
        if (!['approved','rejected','closed'].includes(status)) {
          return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        cr.status = status;
      }

      if (seen === true && cr.recipient_id === req.user.id) {
        cr.seen_at = new Date();
      }

      await cr.save();
      return res.json({ success: true, data: cr });
    } catch (err) {
      console.error('Contact update error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update contact request' });
    }
  },
};

module.exports = contactController;
