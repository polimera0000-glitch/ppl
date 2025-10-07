// src/services/emailService.js
const nodemailer = require("nodemailer");
const config = require("../config");
const rawLogger = require("../utils/logger");

// Defensive logger wrapper
const logger = {
  info:
    typeof rawLogger?.info === "function"
      ? rawLogger.info.bind(rawLogger)
      : console.log.bind(console),
  warn:
    typeof rawLogger?.warn === "function"
      ? rawLogger.warn.bind(rawLogger)
      : console.warn.bind(console),
  error:
    typeof rawLogger?.error === "function"
      ? rawLogger.error.bind(rawLogger)
      : console.error.bind(console),
};

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const smtpHost = config.email?.smtpHost || process.env.EMAIL_SMTP_HOST;
      const smtpPort =
        parseInt(
          config.email?.smtpPort || process.env.EMAIL_SMTP_PORT || "0",
          10
        ) || null;
      const smtpSecure =
        typeof config.email?.smtpSecure !== "undefined"
          ? Boolean(config.email.smtpSecure)
          : process.env.EMAIL_SMTP_SECURE === "true";

      const user = config.email?.user || process.env.EMAIL_USER;
      const pass = config.email?.password || process.env.EMAIL_PASSWORD;

      if (smtpHost && smtpPort) {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: !!smtpSecure,
          auth: user && pass ? { user, pass } : undefined,
          tls:
            config.email?.tlsRejectUnauthorized === false
              ? { rejectUnauthorized: false }
              : undefined,
          connectionTimeout: config.email?.connectionTimeout || 10000,
        });
      } else if (config.email && config.email.service) {
        this.transporter = nodemailer.createTransporter({
          service: config.email.service,
          auth: user && pass ? { user, pass } : undefined,
        });
      } else {
        logger.warn(
          "Email config not provided (SMTP settings missing). Emails will be logged to console."
        );
      }

      if (this.transporter) {
        this.transporter
          .verify()
          .then(() => logger.info("Email transporter verified"))
          .catch((err) =>
            logger.warn(
              "Email transporter verification failed:",
              err && err.message ? err.message : err
            )
          );
      }

      logger.info("Email transporter initialization complete");
    } catch (error) {
      logger.error(
        "Failed to initialize email transporter:",
        error && error.message ? error.message : error
      );
      this.transporter = null;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        logger.info("Email (console fallback) — to:", to, "subject:", subject);
        if (process.env.NODE_ENV === "development") {
          logger.info("Email HTML content:", html);
        } else {
          logger.info("Email preview:", { to, subject });
        }
        return { success: true, messageId: "console-fallback" };
      }

      const mailOptions = {
        from:
          config.email?.from ||
          process.env.EMAIL_FROM ||
          config.email?.user ||
          "no-reply@example.com",
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent", { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId, raw: info };
    } catch (error) {
      logger.error("Failed to send email:", error && (error.message || error));
      return { success: false, error: error && (error.message || error), raw: error };
    }
  }

  // NEW: Send email verification email
  async sendVerificationEmail(email, name, verificationToken) {
    const frontendBase =
      config.frontend?.baseUrl ||
      process.env.FRONTEND_BASE_URL ||
      "http://localhost:3001";

    const scheme = (config && config.app && config.app.deepLinkScheme) || 'eph';
    const deepLink = `${scheme}://verify-email?token=${encodeURIComponent(verificationToken)}`;
    const webFallback = `${frontendBase.replace(/\/+$/, "")}/verify-email?token=${encodeURIComponent(verificationToken)}`;

    const subject = "Verify your EPH Platform email address";
    const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          <tr><td style="padding:28px 32px 12px;">
            <h1 style="margin:0;font-size:20px;color:#0f1724;">Welcome to EPH Platform!</h1>
            <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, please verify your email address to get started.</p>
          </td></tr>

          <tr><td style="padding:18px 32px;">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">
              Click the button below to verify your email address and activate your account.
            </p>

            <div style="text-align:center;margin:18px 0;">
              <a href="${webFallback}" target="_blank" rel="noopener"
                style="display:inline-block;padding:12px 22px;border-radius:8px;background:#10b981;color:#fff;text-decoration:none;font-weight:600;">
                Verify Email Address
              </a>
            </div>

            <p style="margin:16px 0 0;color:#475569;font-size:13px;">
              If the button doesn't work, copy and paste one of these links into your browser or mobile app:
            </p>

            <p style="word-break:break-all;color:#0f1724;font-size:13px;margin:8px 0 0;">
              <strong>Web:</strong> <a href="${webFallback}">${webFallback}</a><br/>
              <strong>App:</strong> <a href="${deepLink}">${deepLink}</a>
            </p>

            <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
            <p style="color:#64748b;font-size:12px;margin:0;">If you didn't create an account, you can safely ignore this email.</p>
          </td></tr>

          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">EPH Platform — Empowering Students, Connecting Opportunities</small>
          </td></tr>
        </table>

        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
      </td></tr>
    </table>
  </body>
</html>
    `;

    const text = `Hi ${name || ""},

Welcome to EPH Platform! Please verify your email address to activate your account.

Verification link: ${webFallback}

If you didn't create an account, please ignore this email.

— EPH Platform`;

    return this.sendEmail(email, subject, html, text);
  }

  // Add this method to your existing emailService.js

// Admin invitation email with temporary credentials
async sendAdminInvitationEmail(email, name, invitationDetails = {}) {
  const { tempPassword, invitedBy, loginUrl } = invitationDetails;
  
  const subject = "You've been invited as an Admin - EPH Platform";
  const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          
          <!-- Header -->
          <tr><td style="padding:28px 32px 12px;">
            <h1 style="margin:0;font-size:22px;color:#0f1724;">🎉 Welcome to EPH Platform Admin</h1>
            <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, you've been invited to join as an administrator by ${invitedBy || "another admin"}.</p>
          </td></tr>

          <!-- Main Content -->
          <tr><td style="padding:18px 32px;">
            <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:16px 0;">
              <h3 style="margin:0 0 8px;color:#92400e;font-size:16px;">⚠️ Important Security Notice</h3>
              <p style="margin:0;color:#92400e;font-size:14px;">
                You must change your password immediately after your first login for security purposes.
              </p>
            </div>

            <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0;">
              <h3 style="margin:0 0 12px;color:#1e293b;font-size:16px;">Your Login Credentials:</h3>
              <p style="margin:0 0 8px;color:#334155;font-size:15px;">
                <strong>Email:</strong> ${email}
              </p>
              <p style="margin:0 0 16px;color:#334155;font-size:15px;">
                <strong>Temporary Password:</strong> 
                <code style="background:#e2e8f0;padding:4px 8px;border-radius:4px;font-family:monospace;font-weight:bold;">${tempPassword}</code>
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;">
                📋 Copy this password carefully - it's case-sensitive and you'll need to change it after login.
              </p>
            </div>

            // <div style="text-align:center;margin:24px 0;">
            //   <a href="${loginUrl || '#'}" target="_blank" rel="noopener"
            //     style="display:inline-block;padding:14px 28px;border-radius:8px;background:#dc2626;color:#fff;text-decoration:none;font-weight:600;font-size:16px;">
            //     Login to Admin Panel
            //   </a>
            // </div>

            <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:20px 0;">
              <h4 style="margin:0 0 8px;color:#0369a1;font-size:15px;">🔐 Next Steps:</h4>
              <ol style="margin:0;padding-left:20px;color:#0c4a6e;font-size:14px;">
                <li style="margin-bottom:4px;">Click the login button above</li>
                <li style="margin-bottom:4px;">Use your email and the temporary password provided</li>
                <li style="margin-bottom:4px;">You'll be prompted to change your password immediately</li>
                <li style="margin-bottom:4px;">Choose a strong, unique password for your admin account</li>
              </ol>
            </div>

            <hr style="border:none;border-top:1px solid #eef2ff;margin:24px 0;" />
            
            <div style="background:#fef2f2;padding:16px;border-radius:8px;border-left:4px solid #ef4444;">
              <p style="margin:0;color:#991b1b;font-size:13px;">
                <strong>Security Reminder:</strong> As an admin, you have access to sensitive platform data. 
                Please keep your credentials secure and never share your password with anyone.
              </p>
            </div>
            
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">EPH Platform — Admin Access</small>
          </td></tr>
        </table>

        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
      </td></tr>
    </table>
  </body>
</html>
  `;

  const text = `Hi ${name || ""},

You've been invited to join EPH Platform as an administrator by ${invitedBy || "another admin"}.

LOGIN CREDENTIALS:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT: You must change your password immediately after your first login for security purposes.

Next Steps:
1. Visit: ${loginUrl || 'the admin login page'}
2. Use your email and the temporary password above
3. You'll be prompted to change your password immediately
4. Choose a strong, unique password for your admin account

Security Reminder: As an admin, you have access to sensitive platform data. Please keep your credentials secure.

— EPH Platform Team`;

  return this.sendEmail(email, subject, html, text);
}

  // UPDATED: Welcome email (sent after verification)
  async sendWelcomeEmail(email, name) {
    const frontendBase =
      config.frontend?.baseUrl ||
      process.env.FRONTEND_BASE_URL ||
      "http://localhost:3000";
    const dashboardUrl = `${frontendBase.replace(/\/$/, "")}/dashboard`;

    const subject = "Welcome to EPH Platform — Get started!";
    const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          <tr><td style="padding:28px 32px 12px;">
            <h1 style="margin:0;font-size:22px;color:#0f1724;">🎉 Welcome to EPH Platform!</h1>
            <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, your email has been verified and your account is now active!</p>
          </td></tr>

          <tr><td style="padding:18px 32px;">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">
              You now have access to exclusive competitions, networking opportunities, and career resources designed for students.
            </p>

            <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
              <h3 style="margin:0 0 8px;color:#1e293b;font-size:16px;">What you can do now:</h3>
              <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;">
                <li>Browse and register for competitions</li>
                <li>Upload project videos to showcase your work</li>
                <li>Earn XP points and redeem exclusive perks</li>
                <li>Connect with hiring partners and investors</li>
              </ul>
            </div>

            <div style="text-align:center;margin:24px 0;">
              <a href="${dashboardUrl}" target="_blank" rel="noopener"
                style="display:inline-block;padding:12px 24px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;">
                Explore Dashboard
              </a>
            </div>
          </td></tr>

          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">EPH Platform — Empowering Students, Connecting Opportunities</small>
          </td></tr>
        </table>

        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
      </td></tr>
    </table>
  </body>
</html>
    `;

    const text = `Welcome to EPH Platform, ${name || ""}!

Your email has been verified and your account is now active!

You now have access to:
- Browse and register for competitions
- Upload project videos to showcase your work
- Earn XP points and redeem exclusive perks
- Connect with hiring partners and investors

Get started: ${dashboardUrl}

— EPH Platform`;

    return this.sendEmail(email, subject, html, text);
  }

  // NEW: Welcome back email (sent on login)
  async sendWelcomeBackEmail(email, name) {
    const frontendBase =
      config.frontend?.baseUrl ||
      process.env.FRONTEND_BASE_URL ||
      "http://localhost:3000";
    const competitionsUrl = `${frontendBase.replace(/\/$/, "")}/competitions`;

    const subject = "Welcome back to EPH Platform!";
    const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          <tr><td style="padding:28px 32px 12px;">
            <h1 style="margin:0;font-size:20px;color:#0f1724;">Welcome back, ${name || "User"}!</h1>
            <p style="margin:12px 0 0;color:#475569;font-size:14px;">Great to see you again on EPH Platform.</p>
          </td></tr>

          <tr><td style="padding:18px 32px;">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">
              Ready to continue your journey? Check out what's new and discover exciting opportunities waiting for you.
            </p>

            <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:16px 0;">
              <h3 style="margin:0 0 8px;color:#0369a1;font-size:16px;">💡 Quick Actions:</h3>
              <p style="margin:0;color:#0c4a6e;font-size:14px;">
                Browse new competitions • Upload your latest projects • Check your XP progress • Explore available perks
              </p>
            </div>

            <div style="text-align:center;margin:24px 0;">
              <a href="${competitionsUrl}" target="_blank" rel="noopener"
                style="display:inline-block;padding:12px 24px;border-radius:8px;background:#059669;color:#fff;text-decoration:none;font-weight:600;">
                View Competitions
              </a>
            </div>

            <p style="margin:16px 0 0;color:#64748b;font-size:13px;text-align:center;">
              Keep building, keep growing, keep inspiring! 🚀
            </p>
          </td></tr>

          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">EPH Platform — Empowering Students, Connecting Opportunities</small>
          </td></tr>
        </table>

        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
      </td></tr>
    </table>
  </body>
</html>
    `;

    const text = `Welcome back, ${name || "User"}!

Great to see you again on EPH Platform.

Ready to continue your journey? 
- Browse new competitions
- Upload your latest projects  
- Check your XP progress
- Explore available perks

View competitions: ${competitionsUrl}

Keep building, keep growing, keep inspiring!

— EPH Platform`;

    return this.sendEmail(email, subject, html, text);
  }

  // NEW: Password changed notification
  async sendPasswordChangedNotification(email, name) {
    const subject = "Password Changed Successfully - EPH Platform";
    const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          <tr><td style="padding:28px 32px 12px;">
            <h1 style="margin:0;font-size:20px;color:#0f1724;">🔒 Password Changed</h1>
            <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, your password has been successfully updated.</p>
          </td></tr>

          <tr><td style="padding:18px 32px;">
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #16a34a;">
              <p style="margin:0;color:#15803d;font-size:14px;">
                <strong>✓ Security Update:</strong> Your account password was changed on ${new Date().toLocaleString()}.
              </p>
            </div>

            <p style="margin:16px 0 0;color:#334155;font-size:15px;">
              If you made this change, no action is needed. If you didn't change your password, please contact our support team immediately.
            </p>

            <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
            <p style="color:#64748b;font-size:12px;margin:0;">
              For security reasons, if this wasn't you, please reset your password and contact support.
            </p>
          </td></tr>

          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">EPH Platform — Empowering Students, Connecting Opportunities</small>
          </td></tr>
        </table>

        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
      </td></tr>
    </table>
  </body>
</html>
    `;

    const text = `Hi ${name || ""},

Your EPH Platform account password was successfully changed on ${new Date().toLocaleString()}.

If you made this change, no action is needed. If you didn't change your password, please contact our support team immediately.

— EPH Platform`;

    return this.sendEmail(email, subject, html, text);
  }

  // Keep existing password reset email method
  async sendPasswordResetEmail(email, name, resetTokenOrObject, opts = {}) {
    const tokenString = (() => {
      if (!resetTokenOrObject) return '';
      if (typeof resetTokenOrObject === 'string') return resetTokenOrObject;
      if (resetTokenOrObject.token) return String(resetTokenOrObject.token);
      if (typeof resetTokenOrObject.get === 'function' && resetTokenOrObject.get('token')) return String(resetTokenOrObject.get('token'));
      if (opts && opts.deepLink) {
        try {
          const u = new URL(opts.deepLink);
          return decodeURIComponent(u.searchParams.get('token') || '');
        } catch (e) { /* ignore */ }
      }
      return '';
    })();

    const expiryMinutes = opts.expiresInSeconds ? Math.round(opts.expiresInSeconds / 60) : 60;

    const frontendBase =
      config.frontend?.baseUrl ||
      process.env.FRONTEND_BASE_URL ||
      "http://localhost:3000";

    const deepLink =
      opts.deepLink ||
      (tokenString ? `${(config.app && config.app.deepLinkScheme) || 'eph'}://reset-password?token=${encodeURIComponent(tokenString)}` : null);

    const webFallback =
      opts.webFallback ||
      (tokenString ? `${frontendBase.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(tokenString)}` : null);

    const buttonHref = webFallback || deepLink || '#';

    const subject = "Reset your EPH Platform password";
    const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          <tr><td style="padding:28px 32px 12px;">
            <h1 style="margin:0;font-size:20px;color:#0f1724;">🔐 Reset your password</h1>
            <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, we received a request to reset your password.</p>
          </td></tr>

          <tr><td style="padding:18px 32px;">
            <p style="margin:0 0 16px;color:#334155;font-size:15px;">
              Click the button below to choose a new password. This link is valid for <strong>${expiryMinutes} minutes</strong>.
            </p>

            <div style="text-align:center;margin:18px 0;">
              <a href="${buttonHref}" target="_blank" rel="noopener"
                style="display:inline-block;padding:12px 22px;border-radius:8px;background:#dc2626;color:#fff;text-decoration:none;font-weight:600;">
                Reset Password
              </a>
            </div>

            <p style="margin:16px 0 0;color:#475569;font-size:13px;">
              If the button doesn't work, copy and paste one of these links into your browser or mobile app:
            </p>

            <p style="word-break:break-all;color:#0f1724;font-size:13px;margin:8px 0 0;">
              ${webFallback ? `<strong>Web:</strong> <a href="${webFallback}">${webFallback}</a><br/>` : ''}
              ${deepLink ? `<strong>App:</strong> <a href="${deepLink}">${deepLink}</a>` : ''}
            </p>

            <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
            <p style="color:#64748b;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email — no changes were made.</p>
          </td></tr>

          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">EPH Platform — Empowering Students, Connecting Opportunities</small>
          </td></tr>
        </table>

        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
      </td></tr>
    </table>
  </body>
</html>
    `;

    const text = `Hi ${name || ""},

We received a request to reset your password for your EPH Platform account.
Use the link below to reset your password (valid for ${expiryMinutes} minutes):

${webFallback || deepLink || ''}

If you didn't request this, please ignore this email.

— EPH Platform`;

    return this.sendEmail(email, subject, html, text);
  }

  // Keep existing methods for backward compatibility
  async sendRegistrationStatusUpdate(email, name, competitionTitle, status, feedback = null) {
    const statusMessages = {
      confirmed: { 
        title: 'Registration Confirmed! 🎉', 
        message: 'Your registration has been confirmed. You can now participate in the competition.',
        color: '#10B981'
      },
      rejected: { 
        title: 'Registration Status Update', 
        message: 'Unfortunately, your registration was not accepted.',
        color: '#EF4444'
      },
      cancelled: { 
        title: 'Registration Cancelled', 
        message: 'Your registration has been cancelled.',
        color: '#6B7280'
      }
    };

    const statusInfo = statusMessages[status] || {
      title: 'Registration Status Update',
      message: `Your registration status has been updated to: ${status}`,
      color: '#667eea'
    };

    const frontendBase = config.frontend?.baseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const subject = `${statusInfo.title} - ${competitionTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${statusInfo.title}</h2>
        </div>
        <div style="padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hi ${name},</p>
          <p><strong>Competition:</strong> ${competitionTitle}</p>
          <p>${statusInfo.message}</p>
          ${feedback ? `
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Additional Notes:</strong>
              <p style="margin: 10px 0 0 0;">${feedback}</p>
            </div>
          ` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendBase.replace(/\/$/, "")}/competitions" 
               style="background-color: #667eea; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View My Registrations
            </a>
          </div>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">
          EPH Platform - Empowering Students, Connecting Opportunities
        </p>
      </div>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // When user submits a project
async sendSubmissionReceivedEmail(email, name, competitionTitle, submissionTitle) {
  const frontendBase = config.frontend?.baseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
  const mySubsUrl = `${frontendBase.replace(/\/$/, "")}/my-submissions`;

  const subject = `Submission received — ${competitionTitle}`;
  const html = `
    <div style="font-family:Arial;max-width:620px;margin:0 auto;">
      <div style="background:#10B981;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
        <strong>Submission received</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
        <p>Hi ${name || 'there'},</p>
        <p>We’ve received your submission <strong>${submissionTitle}</strong> for <strong>${competitionTitle}</strong>.</p>
        <p>You can track status, score and feedback here:</p>
        <p style="text-align:center;margin:20px 0;">
          <a href="${mySubsUrl}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">View my submissions</a>
        </p>
        <p style="color:#6b7280;font-size:12px;">Thanks for participating!</p>
      </div>
    </div>`;
  const text = `Submission received for "${competitionTitle}". View: ${mySubsUrl}`;
  return this.sendEmail(email, subject, html, text);
}

// When admin updates status
async sendSubmissionStatusEmail(email, name, competitionTitle, submissionTitle, status, feedback) {
  const subject = `Submission status updated — ${competitionTitle}`;
  const html = `
    <div style="font-family:Arial;max-width:620px;margin:0 auto;">
      <div style="background:#3B82F6;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
        <strong>Status update</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
        <p>Hi ${name || 'there'},</p>
        <p>Your submission <strong>${submissionTitle}</strong> for <strong>${competitionTitle}</strong> is now: <strong>${status.replace('_',' ')}</strong>.</p>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
      </div>
    </div>`;
  const text = `Your submission "${submissionTitle}" is now ${status}.`;
  return this.sendEmail(email, subject, html, text);
}

// When results are published
async sendResultsPublishedEmail(email, name, competitionTitle) {
  const frontendBase = config.frontend?.baseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
  const mySubsUrl = `${frontendBase.replace(/\/$/, "")}/my-submissions`;

  const subject = `Results published — ${competitionTitle}`;
  const html = `
    <div style="font-family:Arial;max-width:620px;margin:0 auto;">
      <div style="background:#111827;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
        <strong>Results are live</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
        <p>Hi ${name || 'there'},</p>
        <p>Final results for <strong>${competitionTitle}</strong> are now published.</p>
        <p style="text-align:center;margin:20px 0;">
          <a href="${mySubsUrl}" style="background:#10B981;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">See my result</a>
        </p>
      </div>
    </div>`;
  const text = `Results published for "${competitionTitle}". See: ${mySubsUrl}`;
  return this.sendEmail(email, subject, html, text);
}


  async sendCompetitionRegistrationEmail(email, name, competitionTitle, extras = {}) {
  const frontendBase = config.frontend?.baseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
  const competitionsUrl = `${frontendBase.replace(/\/$/, "")}/competitions`;
  const mySubsUrl = `${frontendBase.replace(/\/$/, "")}/my-submissions`;
  const submitHint = extras?.submitUrl || `${competitionsUrl}`; // you can pass a deep link per competition if available

  const subject = `You're registered — ${competitionTitle}`;
  const html = `
    <div style="font-family:Arial;max-width:620px;margin:0 auto;">
      <div style="background:#10B981;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
        <strong>Registration confirmed</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
        <p>Hi ${name || 'there'},</p>
        <p>Your registration for <strong>${competitionTitle}</strong> is confirmed 🎉</p>

        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:14px 0;">
          <strong>Next steps:</strong>
          <ol style="margin:8px 0 0 18px;">
            <li>Prepare your project (code, deck, demo).</li>
            <li>Submit before the deadline via the platform.</li>
            <li>Track status & feedback in <em>My Submissions</em>.</li>
          </ol>
        </div>

        <p style="text-align:center;margin:16px 0;">
          <a href="${submitHint}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Open competition</a>
          &nbsp;&nbsp;
          <a href="${mySubsUrl}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">My submissions</a>
        </p>
      </div>
    </div>`;
  const text = `Registration confirmed for ${competitionTitle}. Next: submit your project. My submissions: ${mySubsUrl}`;
  return this.sendEmail(email, subject, html, text);
}

async sendTeamRegistrationCreatedLeader(email, name, competitionTitle, context = {}) {
  return this.sendCompetitionRegistrationEmail(email, name, competitionTitle, context);
}

async sendTeamRegistrationCreatedMember(email, name, competitionTitle, context = {}) {
  const subject = `You're on the team — ${competitionTitle}`;
  const html = `
    <div style="font-family:Arial;max-width:620px;margin:0 auto;">
      <div style="background:#2563EB;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
        <strong>You're on a team</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
        <p>Hi ${name || 'there'},</p>
        <p>You've been added to a team for <strong>${competitionTitle}</strong>.</p>
        <p>Please coordinate with your team and submit before the deadline.</p>
        ${context?.link ? `<p style="text-align:center;margin:16px 0;">
          <a href="${context.link}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Open competition</a>
        </p>` : ''}
      </div>
    </div>`;
  const text = `You've been added to a team for ${competitionTitle}.`;
  return this.sendEmail(email, subject, html, text);
}

async sendAddedToTeamEmail(email, name, competitionTitle, teamName, context = {}) {
  const subject = `You've been added to "${teamName}" — ${competitionTitle}`;
  const html = `
    <div style="font-family:Arial;max-width:620px;margin:0 auto;">
      <div style="background:#10B981;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
        <strong>Team update</strong>
      </div>
      <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
        <p>Hi ${name || 'there'},</p>
        <p>You've been added to team <strong>${teamName || 'Your Team'}</strong> for <strong>${competitionTitle}</strong>.</p>
        ${context?.link ? `<p style="text-align:center;margin:16px 0;">
          <a href="${context.link}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">View competition</a>
        </p>` : ''}
      </div>
    </div>`;
  const text = `You've been added to team "${teamName}" for ${competitionTitle}.`;
  return this.sendEmail(email, subject, html, text);
}

async sendRemovedFromTeamEmail(email, name, competitionTitle, teamName) {
  const subject = `You were removed from "${teamName}" — ${competitionTitle}`;
  const text = `Hi ${name || 'there'}, you were removed from team "${teamName}" for ${competitionTitle}.`;
  const html = `<div style="font-family:Arial;max-width:620px;margin:0 auto;">
    <div style="background:#EF4444;color:#fff;padding:14px 18px;border-radius:10px 10px 0 0;">
      <strong>Team update</strong>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:18px;border-radius:0 0 10px 10px;">
      <p>${text}</p>
    </div>
  </div>`;
  return this.sendEmail(email, subject, html, text);
}



  async sendPerkRedemptionEmail(email, name, perkTitle, redemptionDetails = {}) {
    const { redemptionCode, redemptionUrl, instructions, termsConditions } = redemptionDetails;
    
    const subject = `Perk Redeemed Successfully - ${perkTitle}`;
    const html = `...`; // keep prior markup
    return await this.sendEmail(email, subject, html);
  }

  async sendAdminMagicLink(email, name, links = {}) {
    const { deepLink, webFallback } = links;
    const subject = "Admin Magic Link - EPH Platform";
    
    const html = `
<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body style="font-family: Arial, sans-serif; background:#f5f7fb; margin:0; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; padding:20px;">
      <h2 style="color:#333;">Admin Access Link</h2>
      <p>Hi ${name || "Admin"},</p>
      <p>Click the link below to access the admin panel:</p>
      <div style="margin:20px 0; text-align:center;">
        <a href="${webFallback || deepLink}" style="background:#2563eb; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">
          Access Admin Panel
        </a>
      </div>
      ${deepLink && webFallback ? `<p><strong>App Link:</strong> <a href="${deepLink}">${deepLink}</a></p>` : ''}
      <p style="color:#666; font-size:12px;">This link expires in 10 minutes.</p>
    </div>
  </body>
</html>
    `;

    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();


// // src/services/emailService.js
// const nodemailer = require("nodemailer");
// const config = require("../config");
// const rawLogger = require("../utils/logger");

// // Defensive logger wrapper: fall back to console if logger methods missing
// const logger = {
//   info:
//     typeof rawLogger?.info === "function"
//       ? rawLogger.info.bind(rawLogger)
//       : console.log.bind(console),
//   warn:
//     typeof rawLogger?.warn === "function"
//       ? rawLogger.warn.bind(rawLogger)
//       : console.warn.bind(console),
//   error:
//     typeof rawLogger?.error === "function"
//       ? rawLogger.error.bind(rawLogger)
//       : console.error.bind(console),
// };

// class EmailService {
//   constructor() {
//     this.transporter = null;
//     this.initializeTransporter();
//   }

//   initializeTransporter() {
//     try {
//       // Prefer explicit SMTP settings if provided
//       const smtpHost = config.email?.smtpHost || process.env.EMAIL_SMTP_HOST;
//       const smtpPort =
//         parseInt(
//           config.email?.smtpPort || process.env.EMAIL_SMTP_PORT || "0",
//           10
//         ) || null;
//       const smtpSecure =
//         typeof config.email?.smtpSecure !== "undefined"
//           ? Boolean(config.email.smtpSecure)
//           : process.env.EMAIL_SMTP_SECURE === "true";

//       const user = config.email?.user || process.env.EMAIL_USER;
//       const pass = config.email?.password || process.env.EMAIL_PASSWORD;

//       if (smtpHost && smtpPort) {
//         // Use explicit SMTP transport
//         this.transporter = nodemailer.createTransport({
//           host: smtpHost,
//           port: smtpPort,
//           secure: !!smtpSecure, // true for 465, false for 587/other
//           auth: user && pass ? { user, pass } : undefined,
//           // optional tls config if you want to ignore unauthorized certs in dev:
//           tls:
//             config.email?.tlsRejectUnauthorized === false
//               ? { rejectUnauthorized: false }
//               : undefined,
//           // connection timeout
//           connectionTimeout: config.email?.connectionTimeout || 10000,
//         });
//       } else if (config.email && config.email.service) {
//         // fallback to nodemailer service shorthand (e.g., 'gmail')
//         this.transporter = nodemailer.createTransport({
//           service: config.email.service,
//           auth: user && pass ? { user, pass } : undefined,
//         });
//       } else {
//         logger.warn(
//           "Email config not provided (SMTP settings missing). Emails will be logged to console."
//         );
//       }

//       if (this.transporter) {
//         // Verify transporter (useful in dev to catch auth issues early)
//         this.transporter
//           .verify()
//           .then(() => logger.info("Email transporter verified"))
//           .catch((err) =>
//             logger.warn(
//               "Email transporter verification failed:",
//               err && err.message ? err.message : err
//             )
//           );
//       }

//       logger.info("Email transporter initialization complete");
//     } catch (error) {
//       logger.error(
//         "Failed to initialize email transporter:",
//         error && error.message ? error.message : error
//       );
//       // keep app running; fallback behavior will log emails
//       this.transporter = null;
//     }
//   }

//   /**
//    * Send an email.
//    * - returns an object { success: boolean, messageId?: string, raw?: any, error?: any }
//    * - never rethrows so callers can choose to treat email failure as non-fatal
//    */
//   async sendEmail(to, subject, html, text = null) {
//     try {
//       if (!this.transporter) {
//         // dev fallback — log to console
//         logger.info("Email (console fallback) — to:", to, "subject:", subject);
//         if (process.env.NODE_ENV === "development") {
//           logger.info("Email HTML content:", html);
//         } else {
//           // still log a compact version
//           logger.info("Email preview:", { to, subject });
//         }
//         return { success: true, messageId: "console-fallback" };
//       }

//       const mailOptions = {
//         from:
//           config.email?.from ||
//           process.env.EMAIL_FROM ||
//           config.email?.user ||
//           "no-reply@example.com",
//         to,
//         subject,
//         html,
//         text: text || html.replace(/<[^>]*>/g, ""),
//       };

//       const info = await this.transporter.sendMail(mailOptions);
//       logger.info("Email sent", { to, subject, messageId: info.messageId });
//       return { success: true, messageId: info.messageId, raw: info };
//     } catch (error) {
//       // Log fully, but return structured failure instead of throwing
//       logger.error("Failed to send email:", error && (error.message || error));
//       return { success: false, error: error && (error.message || error), raw: error };
//     }
//   }

//   /**
//    * Helper: safely extract a token string if caller passed either a string or an object
//    * Acceptable inputs:
//    *  - "tokenstring"
//    *  - { token: "tokenstring" }
//    *  - { tokenString: "tokenstring" }
//    * If nothing sensible found, returns `String(resetToken)` as last resort.
//    */
//   _normalizeTokenToString(resetToken) {
//     if (!resetToken && resetToken !== 0) return "";
//     if (typeof resetToken === "string") return resetToken;
//     if (typeof resetToken === "number") return String(resetToken);
//     if (typeof resetToken === "object" && resetToken !== null) {
//       // commonly used property names
//       if (typeof resetToken.token === "string") return resetToken.token;
//       if (typeof resetToken.tokenString === "string") return resetToken.tokenString;
//       if (typeof resetToken.value === "string") return resetToken.value;
//       // if it's an object returned from model instance (sequelize) try get('token') or dataValues
//       if (typeof resetToken.get === "function") {
//         try {
//           const t = resetToken.get("token");
//           if (typeof t === "string") return t;
//         } catch (e) {}
//       }
//       if (resetToken.dataValues && typeof resetToken.dataValues.token === "string") {
//         return resetToken.dataValues.token;
//       }
//       // last resort: JSON stringify (trim to avoid huge strings)
//       try {
//         const str = JSON.stringify(resetToken);
//         return str.length > 200 ? str.slice(0, 200) + "..." : str;
//       } catch (e) {
//         return String(resetToken);
//       }
//     }
//     return String(resetToken);
//   }

//   async sendPasswordResetEmail(email, name, resetTokenOrObject, opts = {}) {
//   // opts may include: { expiresInSeconds, deepLink, webFallback }
//   // Helper: normalize token -> string
//   const tokenString = (() => {
//     if (!resetTokenOrObject) return '';
//     if (typeof resetTokenOrObject === 'string') return resetTokenOrObject;
//     if (resetTokenOrObject.token) return String(resetTokenOrObject.token);
//     if (typeof resetTokenOrObject.get === 'function' && resetTokenOrObject.get('token')) return String(resetTokenOrObject.get('token'));
//     // If object contains deepLink/webFallback already, prefer token extracted from them if possible
//     if (opts && opts.deepLink) {
//       try {
//         const u = new URL(opts.deepLink);
//         return decodeURIComponent(u.searchParams.get('token') || '');
//       } catch (e) { /* ignore */ }
//     }
//     return '';
//   })();

//   const expiryMinutes = opts.expiresInSeconds ? Math.round(opts.expiresInSeconds / 60) : 60;

//   const frontendBase =
//     config.frontend?.baseUrl ||
//     process.env.FRONTEND_BASE_URL ||
//     "http://localhost:3000";

//   const deepLink =
//     opts.deepLink ||
//     (tokenString ? `${(config.app && config.app.deepLinkScheme) || 'eph'}://reset-password?token=${encodeURIComponent(tokenString)}` : null);

//   const webFallback =
//     opts.webFallback ||
//     (tokenString ? `${frontendBase.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(tokenString)}` : null);

//   // Use webFallback for the button (so clicking in email opens the website).
//   // Keep deepLink visible below for mobile-app users.
//   const buttonHref = webFallback || deepLink || '#';

//   const subject = "Reset your EPH Platform password";
//   const html = `
// <!doctype html>
// <html>
//   <head><meta charset="utf-8"/></head>
//   <body style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; background:#f5f7fb; margin:0;">
//     <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
//       <tr><td align="center" style="padding:32px 16px;">
//         <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
//           <tr><td style="padding:28px 32px 12px;">
//             <h1 style="margin:0;font-size:20px;color:#0f1724;">EPH Platform — Password Reset</h1>
//             <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, we received a request to reset your password.</p>
//           </td></tr>

//           <tr><td style="padding:18px 32px;">
//             <p style="margin:0 0 16px;color:#334155;font-size:15px;">
//               Click the button below to choose a new password. This link is valid for <strong>${expiryMinutes} minutes</strong>.
//             </p>

//             <div style="text-align:center;margin:18px 0;">
//               <a href="${buttonHref}" target="_blank" rel="noopener"
//                 style="display:inline-block;padding:12px 22px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;">
//                 Reset my password
//               </a>
//             </div>

//             <p style="margin:16px 0 0;color:#475569;font-size:13px;">
//               If the button doesn't work, copy and paste one of these links into your browser or mobile app:
//             </p>

//             <p style="word-break:break-all;color:#0f1724;font-size:13px;margin:8px 0 0;">
//               ${webFallback ? `<strong>Web:</strong> <a href="${webFallback}">${webFallback}</a><br/>` : ''}
//               ${deepLink ? `<strong>App (deep link):</strong> <a href="${deepLink}">${deepLink}</a>` : ''}
//             </p>

//             <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
//             <p style="color:#64748b;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email — no changes were made.</p>
//           </td></tr>

//           <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
//             <small style="color:#94a3b8;font-size:12px;">EPH Platform — Empowering Students, Connecting Opportunities</small>
//           </td></tr>
//         </table>

//         <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} EPH Platform</p>
//       </td></tr>
//     </table>
//   </body>
// </html>
//   `;

//   const text = `Hi ${name || ""},

// We received a request to reset your password for your EPH Platform account.
// Use the link below to reset your password (valid for ${expiryMinutes} minutes):

// ${webFallback || deepLink || ''}

// If you didn't request this, please ignore this email.

// — EPH Platform`;

//   return this.sendEmail(email, subject, html, text);
// }

//   async sendRegistrationStatusUpdate(email, name, competitionTitle, status, feedback = null) {
//     const statusMessages = {
//       confirmed: { 
//         title: 'Registration Confirmed! 🎉', 
//         message: 'Your registration has been confirmed. You can now participate in the competition.',
//         color: '#10B981'
//       },
//       rejected: { 
//         title: 'Registration Status Update', 
//         message: 'Unfortunately, your registration was not accepted.',
//         color: '#EF4444'
//       },
//       cancelled: { 
//         title: 'Registration Cancelled', 
//         message: 'Your registration has been cancelled.',
//         color: '#6B7280'
//       }
//     };

//     const statusInfo = statusMessages[status] || {
//       title: 'Registration Status Update',
//       message: `Your registration status has been updated to: ${status}`,
//       color: '#667eea'
//     };

//     const frontendBase = config.frontend?.baseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
//     const subject = `${statusInfo.title} - ${competitionTitle}`;
//     const html = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <div style="background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
//           <h2 style="margin: 0;">${statusInfo.title}</h2>
//         </div>
//         <div style="padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
//           <p>Hi ${name},</p>
//           <p><strong>Competition:</strong> ${competitionTitle}</p>
//           <p>${statusInfo.message}</p>
//           ${feedback ? `
//             <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
//               <strong>Additional Notes:</strong>
//               <p style="margin: 10px 0 0 0;">${feedback}</p>
//             </div>
//           ` : ''}
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${frontendBase.replace(/\/$/, "")}/competitions" 
//                style="background-color: #667eea; color: white; padding: 12px 30px; 
//                       text-decoration: none; border-radius: 5px; display: inline-block;">
//               View My Registrations
//             </a>
//           </div>
//         </div>
//         <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
//         <p style="color: #888; font-size: 12px;">
//           EPH Platform - Empowering Students, Connecting Opportunities
//         </p>
//       </div>
//     `;

//     return await this.sendEmail(email, subject, html);
//   }

//   async sendCompetitionRegistrationEmail(email, name, competitionTitle) {
//     const frontendBase =
//       config.frontend?.baseUrl ||
//       process.env.FRONTEND_BASE_URL ||
//       "http://localhost:3000";
//     const competitionUrl = `${frontendBase.replace(/\/$/, "")}/competitions`;

//     const subject = `You're registered — ${competitionTitle} (EPH Platform)`;
//     const html = `...`; // keep as before or reuse existing markup
//     const text = `Hi ${name || ""},\n\nYour registration for "${competitionTitle}" has been confirmed.\n\nView competition details: ${competitionUrl}\n\n— EPH Platform`;

//     return this.sendEmail(email, subject, html, text);
//   }

//   async sendPerkRedemptionEmail(email, name, perkTitle, redemptionDetails = {}) {
//     const { redemptionCode, redemptionUrl, instructions, termsConditions } = redemptionDetails;
    
//     const subject = `Perk Redeemed Successfully - ${perkTitle}`;
//     const html = `...`; // keep prior markup
//     return await this.sendEmail(email, subject, html);
//   }

//   async sendWelcomeEmail(email, name) {
//     const frontendBase =
//       config.frontend?.baseUrl ||
//       process.env.FRONTEND_BASE_URL ||
//       "http://localhost:3000";
//     const dashboardUrl = `${frontendBase.replace(/\/$/, "")}/dashboard`;

//     const subject = "Welcome to EPH Platform — Get started!";
//     const html = `...`; // keep prior markup
//     const text = `Welcome to EPH Platform, ${name || ""}!\n\nGet started: ${dashboardUrl}\n\n— EPH Platform`;

//     return this.sendEmail(email, subject, html, text);
//   }
// }

// module.exports = new EmailService();
