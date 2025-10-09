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

// ---------- Branding / URLs ----------
const BRAND_NAME = "PPL Platform";
const BRAND_TAGLINE = "Empowering Students, Connecting Opportunities";

const FRONTEND_BASE =
  config.app?.frontendBaseUrl ||
  process.env.FRONTEND_BASE_URL ||
  process.env.FRONTEND_URL ||
  "https://ppl-frontend-vzuv.onrender.com";

const DEEP_LINK_SCHEME =
  (config.app && config.app.deepLinkScheme) ||
  process.env.DEEP_LINK_SCHEME ||
  "ppl";

// helpers
const trimSlash = (s) => String(s || "").replace(/\/+$/, "");
const frontend = trimSlash(FRONTEND_BASE);

function baseEmailShell({ title = BRAND_NAME, bodyHtml = "", preheader = "" }) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${title}</title>
    <style>
      .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;}
      a { text-decoration: none; }
    </style>
  </head>
  <body style="margin:0;background:#f5f7fb;font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;">
    <div class="preheader">${preheader || ""}</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(20,20,40,0.06);">
          ${bodyHtml}
          <tr><td style="padding:18px 32px 28px;background:#fafafa;text-align:center;">
            <small style="color:#94a3b8;font-size:12px;">${BRAND_NAME} — ${BRAND_TAGLINE}</small>
          </td></tr>
        </table>
        <p style="color:#9aa7bf;font-size:12px;margin-top:14px;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const smtpHost = config.email?.smtpHost || process.env.EMAIL_SMTP_HOST;
      const smtpPortRaw = config.email?.smtpPort ?? process.env.EMAIL_SMTP_PORT ?? 0;
      const smtpPort = Number(smtpPortRaw) || null;

      // For GoDaddy's secureserver.net, port 465 MUST use secure:true
      const isGoDaddy = smtpHost && smtpHost.includes('secureserver.net');
      const smtpSecure =
        typeof config.email?.smtpSecure === "boolean"
          ? config.email.smtpSecure
          : smtpPort === 465; // Default: 465=secure, 587=STARTTLS

      const user = config.email?.user || process.env.EMAIL_USER;
      const pass = config.email?.password || process.env.EMAIL_PASSWORD;

      const emailDebug = String(process.env.EMAIL_DEBUG || "").toLowerCase() === "true";

      if (!smtpHost || !smtpPort || !user || !pass) {
        const missingBits = [
          !smtpHost && "EMAIL_SMTP_HOST",
          !smtpPort && "EMAIL_SMTP_PORT",
          !user && "EMAIL_USER",
          !pass && "EMAIL_PASSWORD",
        ]
          .filter(Boolean)
          .join(", ");

        logger.warn(
          "❌ Email config incomplete. Missing: " + (missingBits || "unknown fields")
        );
        logger.warn("⚠️  Emails will be logged to console only (not sent).");
        this.isConfigured = false;
        return;
      }

      // GoDaddy-specific config adjustments
      const transportConfig = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure, // true for 465; false for 587
        auth: { user, pass },
        tls: {
          rejectUnauthorized: isGoDaddy 
            ? false // GoDaddy cert issues - accept their cert
            : !!(config.email && config.email.tlsRejectUnauthorized),
          minVersion: "TLSv1.2",
          servername: smtpHost, // SNI for hosted SMTP
        },
        requireTLS: smtpPort === 587, // Force STARTTLS on 587
        pool: false,
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        logger: emailDebug,
        debug: emailDebug,
      };

      logger.info("🔧 Initializing SMTP transporter:", {
        host: smtpHost,
        port: smtpPort,
        secure: transportConfig.secure,
        user,
        isGoDaddy,
        tlsRejectUnauthorized: transportConfig.tls.rejectUnauthorized,
        requireTLS: transportConfig.requireTLS,
      });

      this.transporter = nodemailer.createTransport(transportConfig);

      // Verify connection (critical for catching config errors)
      this.transporter.verify((err) => {
        if (err) {
          this.isConfigured = false;
          logger.error("❌ Email transporter verification FAILED:", {
            code: err.code,
            command: err.command,
            response: err.response,
            responseCode: err.responseCode,
            message: err.message,
          });

          if (err.code === "EAUTH") {
            logger.error("🔐 Authentication failed. Check:");
            logger.error("   1) Username is full email: admin@theppl.in");
            logger.error("   2) Password is correct (no extra spaces)");
            logger.error("   3) GoDaddy email account is active");
            logger.error("   4) SMTP access is enabled in GoDaddy settings");
          } else if (err.code === "ECONNECTION" || err.code === "ETIMEDOUT") {
            logger.error("🔌 Connection failed. Check:");
            logger.error("   1) SMTP host: smtpout.secureserver.net");
            logger.error("   2) Port 465 for SSL or 587 for TLS");
            logger.error("   3) Firewall/VPC allows outbound to GoDaddy SMTP");
            logger.error("   4) No IP blocking by GoDaddy");
          } else if (err.code === "ESOCKET") {
            logger.error("🔒 SSL/TLS issue. Check:");
            logger.error("   1) Port matches secure setting (465=SSL, 587=TLS)");
            logger.error("   2) GoDaddy cert is valid");
          }
        } else {
          this.isConfigured = true;
          logger.info("✅ Email transporter verified successfully");
          logger.info(`📧 Emails will be sent from: ${this._resolveDefaultFrom()}`);
        }
      });

    } catch (error) {
      this.isConfigured = false;
      logger.error("💥 Failed to initialize email transporter:", error?.message || error);
      this.transporter = null;
    }
  }

  _resolveDefaultFrom() {
    const authUser = config.email?.user || process.env.EMAIL_USER || "";
    const explicitFrom = config.email?.from || process.env.EMAIL_FROM;
    if (explicitFrom) return explicitFrom;

    // For GoDaddy, MUST send from authenticated email
    if (authUser && authUser.includes("@")) {
      return `"${BRAND_NAME}" <${authUser}>`;
    }

    const domain = (authUser.split("@")[1] || "").trim() || "example.com";
    return `"${BRAND_NAME}" <no-reply@${domain}>`;
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      // CRITICAL: Check if configured before attempting to send
      if (!this.transporter || !this.isConfigured) {
        logger.warn("⚠️  Email not configured - logging instead of sending");
        logger.info("📧 Email (console fallback):");
        logger.info(`   To: ${to}`);
        logger.info(`   Subject: ${subject}`);
        if (process.env.NODE_ENV !== "production") {
          logger.info(`   HTML preview: ${String(html || "").slice(0, 300)}...`);
        }
        return { 
          success: false, 
          messageId: "console-fallback",
          error: "Email not configured - check SMTP settings" 
        };
      }

      const fromAddress = this._resolveDefaultFrom();

      const mailOptions = {
        from: fromAddress,
        to,
        subject,
        html,
        text: text || String(html || "").replace(/<[^>]*>/g, ""),
      };

      logger.info("📤 Sending email:", { to, subject, from: mailOptions.from });

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info("✅ Email sent successfully:", {
        to,
        subject,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return { 
        success: true, 
        messageId: info.messageId, 
        raw: info 
      };
    } catch (error) {
      logger.error("❌ Failed to send email:", {
        to,
        subject,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message,
        stack: error.stack,
      });

      // Return detailed error for debugging
      return { 
        success: false, 
        error: error?.message || error, 
        code: error?.code,
        raw: error 
      };
    }
  }

  // ---------------- Verification ----------------
  async sendVerificationEmail(email, name, verificationToken) {
    const webLink = `${frontend}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const deepLink = `${DEEP_LINK_SCHEME}://verify-email?token=${encodeURIComponent(verificationToken)}`;

    const subject = `Verify your email — ${BRAND_NAME}`;
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:22px;color:#0f1724;">Welcome to ${BRAND_NAME}!</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, please verify your email address to get started.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">Click the button below to verify your email and activate your account.</p>
        <div style="text-align:center;margin:18px 0;">
          <a href="${webLink}" target="_blank" rel="noopener"
             style="display:inline-block;padding:12px 22px;border-radius:8px;background:#10b981;color:#fff;font-weight:600;">
            Verify Email
          </a>
        </div>
        <p style="margin:16px 0 0;color:#475569;font-size:13px;">If the button doesn't work, use one of these links:</p>
        <p style="word-break:break-all;color:#0f1724;font-size:13px;margin:8px 0 0;">
          <strong>Web:</strong> <a href="${webLink}">${webLink}</a><br/>
          <strong>App:</strong> <a href="${deepLink}">${deepLink}</a>
        </p>
        <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
        <p style="color:#64748b;font-size:12px;margin:0;">If you didn't create an account, please ignore this email.</p>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "Verify your email to activate your PPL account.",
      bodyHtml,
    });

    const text = `Hi ${name || "there"},

Welcome to ${BRAND_NAME}! Please verify your email to activate your account.

Web: ${webLink}
App: ${deepLink}

If you didn't create an account, you can ignore this email.`;

    return this.sendEmail(email, subject, html, text);
  }

  // ---------------- Welcome (after verification) ----------------
  async sendWelcomeEmail(email, name) {
    const dashboardUrl = `${frontend}/dashboard`;
    const subject = `Welcome to ${BRAND_NAME}!`;
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:22px;color:#0f1724;">🎉 You're all set, ${name || "friend"}!</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Your email is verified and your account is active.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:12px 0;">
          <h3 style="margin:0 0 8px;color:#1e293b;font-size:16px;">What’s next?</h3>
          <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;">
            <li>Browse and register for competitions</li>
            <li>Upload projects to showcase your work</li>
            <li>Track XP and redeem perks</li>
            <li>Connect with hiring partners and investors</li>
          </ul>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${dashboardUrl}" target="_blank" rel="noopener"
             style="display:inline-block;padding:12px 24px;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;">
            Go to Dashboard
          </a>
        </div>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "Your PPL account is ready.",
      bodyHtml,
    });
    const text = `Welcome to ${BRAND_NAME}, ${name || ""}!

You're verified and ready to go.

Next steps:
- Register for competitions
- Upload projects
- Track XP and redeem perks
- Connect with partners

Dashboard: ${dashboardUrl}`;

    return this.sendEmail(email, subject, html, text);
  }

  // ---------------- Welcome back (login) ----------------
  async sendWelcomeBackEmail(email, name) {
    const competitionsUrl = `${frontend}/competitions`;
    const subject = `Welcome back to ${BRAND_NAME}`;
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:20px;color:#0f1724;">Welcome back, ${name || "there"}!</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Pick up where you left off.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:12px 0;">
          <p style="margin:0;color:#0c4a6e;font-size:14px;">
            Browse competitions • Upload projects • Check XP • Explore perks
          </p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${competitionsUrl}" target="_blank" rel="noopener"
             style="display:inline-block;padding:12px 24px;border-radius:8px;background:#059669;color:#fff;font-weight:600;">
            View Competitions
          </a>
        </div>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "See what’s new on PPL.",
      bodyHtml,
    });
    const text = `Welcome back to ${BRAND_NAME}, ${name || "there"}!

Browse competitions, upload a project, check XP, and explore perks.
${competitionsUrl}`;

    return this.sendEmail(email, subject, html, text);
  }

  // ---------------- Password changed ----------------
  async sendPasswordChangedNotification(email, name) {
    const subject = `Your ${BRAND_NAME} password was changed`;
    const when = new Date().toLocaleString();
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:20px;color:#0f1724;">🔒 Password updated</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, your password was changed on ${when}.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <p style="margin:0 0 12px;color:#334155;font-size:15px;">If this was you, no action is needed.</p>
        <p style="margin:0;color:#334155;font-size:15px;">If not, reset your password and contact support immediately.</p>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "Security notice from PPL.",
      bodyHtml,
    });
    const text = `Hi ${name || "there"},

Your ${BRAND_NAME} password was changed on ${when}.
If this wasn’t you, reset your password and contact support immediately.`;

    return this.sendEmail(email, subject, html, text);
  }

  // ---------------- Password reset ----------------
  async sendPasswordResetEmail(email, name, resetTokenOrObject, opts = {}) {
    const tokenString = (() => {
      if (!resetTokenOrObject) return "";
      if (typeof resetTokenOrObject === "string") return resetTokenOrObject;
      if (resetTokenOrObject.token) return String(resetTokenOrObject.token);
      if (typeof resetTokenOrObject.get === "function" && resetTokenOrObject.get("token"))
        return String(resetTokenOrObject.get("token"));
      if (opts && opts.deepLink) {
        try {
          const u = new URL(opts.deepLink);
          return decodeURIComponent(u.searchParams.get("token") || "");
        } catch {}
      }
      return "";
    })();

    const expiryMinutes = opts.expiresInSeconds
      ? Math.round(opts.expiresInSeconds / 60)
      : 60;

    const deepLink =
      opts.deepLink ||
      (tokenString
        ? `${DEEP_LINK_SCHEME}://reset-password?token=${encodeURIComponent(tokenString)}`
        : null);

    const webFallback =
      opts.webFallback ||
      (tokenString
        ? `${frontend}/reset-password?token=${encodeURIComponent(tokenString)}`
        : null);

    const buttonHref = webFallback || deepLink || "#";

    const subject = `Reset your password — ${BRAND_NAME}`;
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:20px;color:#0f1724;">Reset your password</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, we received a request to reset your password.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;">This link is valid for <strong>${expiryMinutes} minutes</strong>.</p>
        <div style="text-align:center;margin:18px 0;">
          <a href="${buttonHref}" target="_blank" rel="noopener"
             style="display:inline-block;padding:12px 22px;border-radius:8px;background:#dc2626;color:#fff;font-weight:600;">
            Reset Password
          </a>
        </div>
        <p style="margin:16px 0 0;color:#475569;font-size:13px;">If the button doesn't work, use one of these links:</p>
        <p style="word-break:break-all;color:#0f1724;font-size:13px;margin:8px 0 0;">
          ${webFallback ? `<strong>Web:</strong> <a href="${webFallback}">${webFallback}</a><br/>` : ""}
          ${deepLink ? `<strong>App:</strong> <a href="${deepLink}">${deepLink}</a>` : ""}
        </p>
        <hr style="border:none;border-top:1px solid #eef2ff;margin:20px 0;" />
        <p style="color:#64748b;font-size:12px;margin:0;">If you didn’t request this, you can safely ignore this email.</p>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "Use the secure link to reset your PPL password.",
      bodyHtml,
    });
    const text = `Hi ${name || "there"},

We received a request to reset your ${BRAND_NAME} password.
This link is valid for ${expiryMinutes} minutes.

${webFallback || deepLink || ""}

If you didn’t request this, you can ignore this email.`;

    return this.sendEmail(email, subject, html, text);
  }

  // ---------------- Admin invitation (optional) ----------------
  async sendAdminInvitationEmail(email, name, { tempPassword, invitedBy, loginUrl } = {}) {
    const subject = `You’ve been invited as an Admin — ${BRAND_NAME}`;
    const safeLoginUrl = loginUrl || `${frontend}/admin`;
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:22px;color:#0f1724;">Welcome to ${BRAND_NAME} Admin</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "there"}, you've been invited by ${invitedBy || "an admin"}.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:16px 0;">
          <h3 style="margin:0 0 8px;color:#92400e;font-size:16px;">Important</h3>
          <p style="margin:0;color:#92400e;font-size:14px;">Change your temporary password immediately after your first login.</p>
        </div>
        <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#1e293b;font-size:16px;">Your Credentials</h3>
          <p style="margin:0 0 8px;color:#334155;font-size:15px;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0 0 8px;color:#334155;font-size:15px;"><strong>Temporary Password:</strong>
            <code style="background:#e2e8f0;padding:4px 8px;border-radius:4px;font-family:monospace;">${tempPassword}</code>
          </p>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${safeLoginUrl}" target="_blank" rel="noopener"
             style="display:inline-block;padding:14px 28px;border-radius:8px;background:#111827;color:#fff;font-weight:600;">
            Login to Admin
          </a>
        </div>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "Admin access for PPL Platform.",
      bodyHtml,
    });
    const text = `Hi ${name || ""},

You've been invited as an Admin on ${BRAND_NAME} by ${invitedBy || "an admin"}.

Email: ${email}
Temporary Password: ${tempPassword}
Login: ${safeLoginUrl}

Please change your password immediately after your first login.`;

    return this.sendEmail(email, subject, html, text);
  }

  // ---------------- Admin magic link ----------------
  async sendAdminMagicLink(email, name, { deepLink, webFallback } = {}) {
    const subject = `Admin access link — ${BRAND_NAME}`;
    const url = webFallback || deepLink || `${frontend}/admin`;
    const bodyHtml = `
      <tr><td style="padding:28px 32px 12px;">
        <h1 style="margin:0;font-size:20px;color:#0f1724;">Admin Access</h1>
        <p style="margin:12px 0 0;color:#475569;font-size:14px;">Hi ${name || "Admin"}, use the secure link below to access the admin panel.</p>
      </td></tr>
      <tr><td style="padding:18px 32px;">
        <div style="text-align:center;margin:20px 0;">
          <a href="${url}" target="_blank" rel="noopener"
             style="display:inline-block;padding:12px 24px;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;">
            Open Admin
          </a>
        </div>
        <p style="color:#666;font-size:12px;text-align:center;">This link may expire soon.</p>
      </td></tr>
    `;
    const html = baseEmailShell({
      title: subject,
      preheader: "Secure admin magic link.",
      bodyHtml,
    });

    return this.sendEmail(email, subject, html, `Admin access link: ${url}`);
  }

  // ---- Competition & submission emails ----

  async sendRegistrationStatusUpdate(email, name, competitionTitle, status, feedback = null) {
    const statusMessages = {
      confirmed: { title: "Registration confirmed 🎉", message: "You can now participate.", color: "#10B981" },
      rejected:  { title: "Registration update", message: "Unfortunately, your registration was not accepted.", color: "#EF4444" },
      cancelled: { title: "Registration cancelled", message: "Your registration has been cancelled.", color: "#6B7280" },
    };
    const s = statusMessages[status] || { title: "Registration update", message: `Status: ${status}`, color: "#667eea" };
    const subject = `${s.title} — ${competitionTitle}`;
    const bodyHtml = `
      <tr><td style="padding:20px 24px;background:${s.color};color:#fff;">
        <h2 style="margin:0;font-size:18px;">${s.title}</h2>
      </td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 6px;">Hi ${name || "there"},</p>
        <p style="margin:0 0 10px;"><strong>Competition:</strong> ${competitionTitle}</p>
        <p style="margin:0 0 10px;">${s.message}</p>
        ${feedback ? `<div style="background:#f8f9fa;padding:12px;border-radius:6px;margin:14px 0;"><strong>Notes:</strong><br/>${feedback}</div>` : ""}
        <div style="text-align:center;margin:18px 0;">
          <a href="${frontend}/competitions" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#111827;color:#fff;">View my registrations</a>
        </div>
      </td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "Competition registration update.", bodyHtml });
    return this.sendEmail(email, subject, html);
  }

  async sendSubmissionReceivedEmail(email, name, competitionTitle, submissionTitle) {
    const mySubsUrl = `${frontend}/my-submissions`;
    const subject = `Submission received — ${competitionTitle}`;
    const bodyHtml = `
      <tr><td style="padding:14px 18px;background:#10B981;color:#fff;">
        <strong>Submission received</strong>
      </td></tr>
      <tr><td style="padding:18px;">
        <p>Hi ${name || "there"},</p>
        <p>We’ve received your submission <strong>${submissionTitle}</strong> for <strong>${competitionTitle}</strong>.</p>
        <p style="text-align:center;margin:16px 0;">
          <a href="${mySubsUrl}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:8px;display:inline-block;">View my submissions</a>
        </p>
      </td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "We got your submission.", bodyHtml });
    const text = `Submission received for "${competitionTitle}" — "${submissionTitle}". View: ${mySubsUrl}`;
    return this.sendEmail(email, subject, html, text);
  }

  async sendSubmissionStatusEmail(email, name, competitionTitle, submissionTitle, status, feedback) {
    const subject = `Submission status updated — ${competitionTitle}`;
    const bodyHtml = `
      <tr><td style="padding:14px 18px;background:#3B82F6;color:#fff;">
        <strong>Status update</strong>
      </td></tr>
      <tr><td style="padding:18px;">
        <p>Hi ${name || "there"},</p>
        <p>Your submission <strong>${submissionTitle}</strong> for <strong>${competitionTitle}</strong> is now: <strong>${String(status).replace("_", " ")}</strong>.</p>
        ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ""}
      </td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "Your submission status changed.", bodyHtml });
    const text = `Your submission "${submissionTitle}" is now ${status}.`;
    return this.sendEmail(email, subject, html, text);
  }

  async sendResultsPublishedEmail(email, name, competitionTitle) {
    const mySubsUrl = `${frontend}/my-submissions`;
    const subject = `Results published — ${competitionTitle}`;
    const bodyHtml = `
      <tr><td style="padding:14px 18px;background:#111827;color:#fff;">
        <strong>Results are live</strong>
      </td></tr>
      <tr><td style="padding:18px;">
        <p>Hi ${name || "there"},</p>
        <p>Final results for <strong>${competitionTitle}</strong> are now published.</p>
        <p style="text-align:center;margin:16px 0;">
          <a href="${mySubsUrl}" style="background:#10B981;color:#fff;padding:10px 18px;border-radius:8px;display:inline-block;">See my result</a>
        </p>
      </td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "Results are live.", bodyHtml });
    const text = `Results published for "${competitionTitle}". See: ${mySubsUrl}`;
    return this.sendEmail(email, subject, html, text);
  }

  async sendCompetitionRegistrationEmail(email, name, competitionTitle, extras = {}) {
    const competitionsUrl = `${frontend}/competitions`;
    const mySubsUrl = `${frontend}/my-submissions`;
    const submitHint = extras?.submitUrl || competitionsUrl;

    const subject = `You're registered — ${competitionTitle}`;
    const bodyHtml = `
      <tr><td style="padding:14px 18px;background:#10B981;color:#fff;">
        <strong>Registration confirmed</strong>
      </td></tr>
      <tr><td style="padding:18px;">
        <p>Hi ${name || "there"},</p>
        <p>Your registration for <strong>${competitionTitle}</strong> is confirmed 🎉</p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:14px 0;">
          <strong>Next steps:</strong>
          <ol style="margin:8px 0 0 18px;">
            <li>Prepare your project (code, deck, demo)</li>
            <li>Submit before the deadline via the platform</li>
            <li>Track status & feedback in <em>My Submissions</em></li>
          </ol>
        </div>
        <p style="text-align:center;margin:16px 0;">
          <a href="${submitHint}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;display:inline-block;">Open competition</a>
          &nbsp;&nbsp;
          <a href="${mySubsUrl}" style="background:#111827;color:#fff;padding:10px 18px;border-radius:8px;display:inline-block;">My submissions</a>
        </p>
      </td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "You're in!", bodyHtml });
    const text = `Registration confirmed for ${competitionTitle}. Next: submit your project. My submissions: ${mySubsUrl}`;
    return this.sendEmail(email, subject, html, text);
  }

  async sendAddedToTeamEmail(email, name, competitionTitle, teamName, context = {}) {
    const subject = `You've been added to "${teamName}" — ${competitionTitle}`;
    const link = context?.link;
    const bodyHtml = `
      <tr><td style="padding:14px 18px;background:#10B981;color:#fff;"><strong>Team update</strong></td></tr>
      <tr><td style="padding:18px;">
        <p>Hi ${name || "there"},</p>
        <p>You've been added to team <strong>${teamName || "Your Team"}</strong> for <strong>${competitionTitle}</strong>.</p>
        ${link ? `<p style="text-align:center;margin:16px 0;"><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;display:inline-block;">View competition</a></p>` : ""}
      </td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "You've joined a team.", bodyHtml });
    const text = `You've been added to team "${teamName}" for ${competitionTitle}.`;
    return this.sendEmail(email, subject, html, text);
  }

  async sendRemovedFromTeamEmail(email, name, competitionTitle, teamName) {
    const subject = `Removed from "${teamName}" — ${competitionTitle}`;
    const text = `Hi ${name || "there"}, you were removed from team "${teamName}" for ${competitionTitle}.`;
    const bodyHtml = `
      <tr><td style="padding:14px 18px;background:#EF4444;color:#fff;"><strong>Team update</strong></td></tr>
      <tr><td style="padding:18px;"><p>${text}</p></td></tr>
    `;
    const html = baseEmailShell({ title: subject, preheader: "Team change.", bodyHtml });
    return this.sendEmail(email, subject, html, text);
  }
}

module.exports = new EmailService();
