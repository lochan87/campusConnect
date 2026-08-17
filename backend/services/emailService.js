const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendPasswordResetEmail = async (toEmail, resetLink, displayName = '') => {
  const transporter = createTransporter();
  const firstName = displayName ? displayName.split(' ')[0] : 'there';
  const year = new Date().getFullYear();

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>Reset Your CampusConnect Password</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #070714;
      -webkit-text-size-adjust: 100%;
      margin: 0; padding: 0;
    }
    .preheader { display:none !important; max-height:0; overflow:hidden; mso-hide:all; }
    .email-wrapper { width:100%; background:#070714; padding: 48px 16px; }
    .email-card {
      max-width: 580px;
      margin: 0 auto;
      background: #0d0d1f;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(139,92,246,0.15);
      box-shadow:
        0 0 0 1px rgba(139,92,246,0.08),
        0 32px 64px rgba(0,0,0,0.6),
        0 0 80px rgba(109,40,217,0.08);
    }

    /* ── TOP ACCENT BAR ── */
    .accent-bar {
      height: 4px;
      background: linear-gradient(90deg, #7c3aed, #6366f1, #a855f7, #6366f1, #7c3aed);
      background-size: 200% 100%;
    }

    /* ── HERO HEADER ── */
    .hero {
      padding: 48px 40px 40px;
      text-align: center;
      position: relative;
      background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(109,40,217,0.18) 0%, transparent 70%);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .logo-wrap {
      display: inline-block;
      margin-bottom: 28px;
    }
    .logo-outer {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.25));
      border-radius: 22px;
      border: 1.5px solid rgba(139,92,246,0.35);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
      margin: 0 auto;
    }
    .logo-inner {
      width: 54px; height: 54px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(124,58,237,0.4);
    }
    .logo-text { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }

    .brand-name {
      font-size: 13px; font-weight: 600; letter-spacing: 3px;
      color: rgba(167,139,250,0.7); text-transform: uppercase;
      margin-bottom: 20px; display: block;
    }

    /* Lock icon circle */
    .icon-circle {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.15));
      border: 1.5px solid rgba(139,92,246,0.25);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    .hero-title {
      font-size: 30px; font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.8px;
      line-height: 1.2;
      margin-bottom: 10px;
    }
    .hero-title span { 
      background: linear-gradient(135deg, #a78bfa, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-subtitle {
      font-size: 15px; color: #64748b; line-height: 1.5;
    }

    /* ── BODY ── */
    .body { padding: 40px 40px 32px; }

    .greeting {
      font-size: 18px; font-weight: 700;
      color: #f1f5f9; margin-bottom: 12px;
    }
    .message {
      font-size: 15px; color: #94a3b8; line-height: 1.75;
      margin-bottom: 36px;
    }
    .email-pill {
      display: inline-block;
      background: rgba(139,92,246,0.12);
      border: 1px solid rgba(139,92,246,0.25);
      border-radius: 6px;
      padding: 2px 8px;
      color: #c4b5fd;
      font-weight: 600;
      font-size: 14px;
      font-family: 'Courier New', monospace;
    }

    /* ── CTA BUTTON ── */
    .btn-outer {
      text-align: center;
      margin-bottom: 36px;
    }
    .btn-container {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
      border-radius: 16px;
      padding: 2px;
      box-shadow: 0 8px 32px rgba(124,58,237,0.35), 0 2px 8px rgba(0,0,0,0.3);
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 18px 52px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    /* ── STEP CARDS ── */
    .steps-label {
      font-size: 11px; font-weight: 700; letter-spacing: 2px;
      text-transform: uppercase; color: #475569;
      margin-bottom: 14px;
    }
    .steps {
      display: flex;
      gap: 0;
      margin-bottom: 36px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .step {
      flex: 1;
      padding: 16px 14px;
      text-align: center;
      background: rgba(255,255,255,0.02);
      border-right: 1px solid rgba(255,255,255,0.05);
    }
    .step:last-child { border-right: none; }
    .step-num {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      border-radius: 50%;
      font-size: 12px; font-weight: 700; color: #fff;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 8px;
    }
    .step-text { font-size: 11px; color: #64748b; line-height: 1.4; }
    .step-text strong { color: #94a3b8; font-weight: 600; display: block; margin-bottom: 2px; }

    /* ── EXPIRY NOTICE ── */
    .notice {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,191,36,0.04));
      border: 1px solid rgba(245,158,11,0.18);
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 28px;
    }
    .notice-icon-wrap {
      width: 36px; height: 36px; flex-shrink: 0;
      background: rgba(245,158,11,0.1);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }
    .notice-content { flex: 1; }
    .notice-title { font-size: 13px; font-weight: 700; color: #fbbf24; margin-bottom: 4px; }
    .notice-body { font-size: 12px; color: #92400e; line-height: 1.5; color: rgba(251,191,36,0.65); }

    /* ── LINK FALLBACK ── */
    .link-box {
      background: rgba(255,255,255,0.02);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 32px;
    }
    .link-box-label {
      font-size: 11px; font-weight: 600; letter-spacing: 1px;
      text-transform: uppercase; color: #475569; margin-bottom: 10px;
    }
    .link-box a {
      font-size: 11.5px; color: #818cf8;
      word-break: break-all; text-decoration: none;
      line-height: 1.5;
    }

    /* ── DIVIDER ── */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
      margin: 28px 0;
    }

    .ignore-note {
      font-size: 13px; color: #334155; text-align: center; line-height: 1.6;
    }

    /* ── FOOTER ── */
    .footer {
      padding: 28px 40px;
      border-top: 1px solid rgba(255,255,255,0.04);
      background: rgba(0,0,0,0.3);
    }
    .footer-badges {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px; font-weight: 500;
    }
    .badge-green {
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.18);
      color: #34d399;
    }
    .badge-blue {
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.18);
      color: #818cf8;
    }
    .footer-copy {
      text-align: center;
      font-size: 12px; color: #1e293b; color: #334155; line-height: 1.7;
    }
    .footer-copy a { color: #4f46e5; text-decoration: none; }
    .footer-divider {
      height: 1px;
      background: rgba(255,255,255,0.04);
      margin: 16px 0;
    }
    .footer-legal {
      text-align: center;
      font-size: 11px; color: #1e293b; line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- Preheader (invisible preview text in inbox) -->
  <span class="preheader">Reset your CampusConnect password — this link expires in 1 hour. If you didn't request this, ignore this email.</span>

  <div class="email-wrapper">
    <div class="email-card">

      <!-- Accent bar -->
      <div class="accent-bar"></div>

      <!-- Hero -->
      <div class="hero">
        <!-- Logo -->
        <div class="logo-wrap">
          <div class="logo-outer">
            <div class="logo-inner">
              <span class="logo-text">CC</span>
            </div>
          </div>
        </div>
        <span class="brand-name">CampusConnect</span>
        <div class="icon-circle">🔐</div>
        <h1 class="hero-title">Reset Your<br/><span>Password</span></h1>
        <p class="hero-subtitle">A request was made to reset your account password</p>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="greeting">Hey ${firstName}! 👋</p>
        <p class="message">
          We received a password reset request for your CampusConnect account
          linked to <span class="email-pill">${toEmail}</span>.<br/><br/>
          No worries — it happens! Just click the button below and you'll be back
          on campus in no time.
        </p>

        <!-- CTA -->
        <div class="btn-outer">
          <div class="btn-container">
            <a href="${resetLink}" class="btn">Reset My Password &rarr;</a>
          </div>
        </div>

        <!-- Steps -->
        <p class="steps-label">How it works</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:36px;">
          <tr>
            <td style="width:33.3%;padding:16px 14px;text-align:center;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.05);">
              <div style="width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;font-size:12px;font-weight:700;color:#fff;text-align:center;line-height:28px;margin:0 auto 8px;">1</div>
              <p style="font-size:11px;color:#94a3b8;font-weight:600;margin-bottom:2px;">Click button</p>
              <p style="font-size:11px;color:#475569;">Above link opens</p>
            </td>
            <td style="width:33.3%;padding:16px 14px;text-align:center;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.05);">
              <div style="width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;font-size:12px;font-weight:700;color:#fff;text-align:center;line-height:28px;margin:0 auto 8px;">2</div>
              <p style="font-size:11px;color:#94a3b8;font-weight:600;margin-bottom:2px;">New password</p>
              <p style="font-size:11px;color:#475569;">Choose a strong one</p>
            </td>
            <td style="width:33.3%;padding:16px 14px;text-align:center;background:rgba(255,255,255,0.02);">
              <div style="width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;font-size:12px;font-weight:700;color:#fff;text-align:center;line-height:28px;margin:0 auto 8px;">3</div>
              <p style="font-size:11px;color:#94a3b8;font-weight:600;margin-bottom:2px;">Sign in</p>
              <p style="font-size:11px;color:#475569;">Back on campus!</p>
            </td>
          </tr>
        </table>

        <!-- Expiry notice -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:linear-gradient(135deg,rgba(245,158,11,0.06),rgba(251,191,36,0.04));border:1px solid rgba(245,158,11,0.18);border-radius:14px;padding:18px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:44px;vertical-align:top;">
                    <div style="width:36px;height:36px;background:rgba(245,158,11,0.1);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">⏰</div>
                  </td>
                  <td style="vertical-align:top;padding-left:12px;">
                    <p style="font-size:13px;font-weight:700;color:#fbbf24;margin-bottom:4px;">Expires in 1 hour</p>
                    <p style="font-size:12px;color:rgba(251,191,36,0.6);line-height:1.5;">This reset link will expire after one hour for your security. After that, you'll need to request a new one from the login page.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Link fallback -->
        <div class="link-box">
          <p class="link-box-label">Or copy this link</p>
          <a href="${resetLink}">${resetLink}</a>
        </div>

        <!-- Divider -->
        <div class="divider"></div>
        <p class="ignore-note">
          🛡️ &nbsp;Didn't request a password reset?<br/>
          <span style="color:#1e40af;color:#334155;">Your account is safe — just ignore this email. No changes will be made.</span>
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-badges">
          <span class="badge badge-green">🔒 Firebase Secured</span>
          <span class="badge badge-blue">✉️ Official Email</span>
        </div>
        <p class="footer-copy">
          Sent by CampusConnect &middot; <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
        </p>
        <div class="footer-divider"></div>
        <p class="footer-legal">
          &copy; ${year} CampusConnect. All rights reserved.<br/>
          You're receiving this because a password reset was requested for your account.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Reset your CampusConnect password',
    html: htmlTemplate,
    text: `Hi ${firstName},

A password reset was requested for your CampusConnect account (${toEmail}).

Reset your password here (link expires in 1 hour):
${resetLink}

If you didn't request this, you can safely ignore this email.

— CampusConnect Team`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Password reset email sent to ${toEmail} [${info.messageId}]`);
  return info;
};

// ─────────────────────────────────────────────
// WELCOME EMAIL — sent once on first registration
// ─────────────────────────────────────────────
const sendWelcomeEmail = async (toEmail, displayName = '', username = '') => {
  const transporter = createTransporter();
  const firstName = displayName ? displayName.split(' ')[0] : 'there';
  const year = new Date().getFullYear();

  const features = [
    { icon: '📢', title: 'Campus Feed', desc: 'Post updates, share memes, ask questions — your campus timeline lives here.' },
    { icon: '📊', title: 'Live Polls', desc: 'Create polls and get instant reactions from your entire campus community.' },
    { icon: '🎉', title: 'Events', desc: 'Discover fests, workshops, and club events. RSVP in one tap.' },
    { icon: '🏆', title: 'Leaderboard', desc: 'Earn reputation points by contributing. Climb the campus rankings.' },
    { icon: '💬', title: 'Direct Messages', desc: 'Chat privately with classmates and club members.' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Powered by Gemini AI — get smart summaries, suggestions, and more.' },
  ];

  const featureRows = features.map(f => `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:52px;vertical-align:top;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(99,102,241,0.15));border:1px solid rgba(139,92,246,0.2);border-radius:12px;text-align:center;line-height:44px;font-size:20px;">${f.icon}</div>
            </td>
            <td style="vertical-align:top;padding-left:14px;">
              <p style="font-size:14px;font-weight:700;color:#f1f5f9;margin:0 0 3px;">${f.title}</p>
              <p style="font-size:13px;color:#64748b;margin:0;line-height:1.5;">${f.desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to CampusConnect!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#070714; }
    .preheader { display:none !important; max-height:0; overflow:hidden; }
  </style>
</head>
<body>
  <span class="preheader">Welcome to CampusConnect, ${firstName}! Your campus life starts here. Explore your feed, join events, and connect with your college community.</span>

  <div style="background:#070714;padding:48px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#0d0d1f;border-radius:24px;overflow:hidden;border:1px solid rgba(139,92,246,0.15);box-shadow:0 32px 64px rgba(0,0,0,0.6);">

      <!-- Accent bar -->
      <div style="height:4px;background:linear-gradient(90deg,#7c3aed,#6366f1,#a855f7,#6366f1,#7c3aed);"></div>

      <!-- Hero -->
      <div style="padding:52px 40px 40px;text-align:center;background:radial-gradient(ellipse 90% 60% at 50% 0%,rgba(109,40,217,0.2) 0%,transparent 70%);border-bottom:1px solid rgba(255,255,255,0.05);">
        <!-- Logo -->
        <div style="width:80px;height:80px;background:linear-gradient(135deg,rgba(124,58,237,0.25),rgba(99,102,241,0.25));border-radius:22px;border:1.5px solid rgba(139,92,246,0.35);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(124,58,237,0.2),inset 0 1px 0 rgba(255,255,255,0.08);">
          <div style="width:54px;height:54px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:14px;text-align:center;line-height:54px;">
            <span style="font-size:20px;font-weight:800;color:#fff;">CC</span>
          </div>
        </div>
        <span style="display:block;font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(167,139,250,0.6);text-transform:uppercase;margin-bottom:24px;">CampusConnect</span>

        <!-- Party popper animation row -->
        <div style="font-size:40px;margin-bottom:18px;">🎓</div>

        <h1 style="font-size:32px;font-weight:800;color:#f8fafc;letter-spacing:-0.8px;line-height:1.2;margin-bottom:12px;">Welcome aboard,<br/><span style="background:linear-gradient(135deg,#a78bfa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${firstName}!</span></h1>
        <p style="font-size:15px;color:#64748b;line-height:1.6;max-width:380px;margin:0 auto;">You've joined a platform built for your campus community. Your college life just got a whole lot better.</p>
      </div>

      <!-- Quick stats strip -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <tr>
          <td style="width:33.3%;padding:20px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.05);">
            <p style="font-size:22px;font-weight:800;color:#a78bfa;margin-bottom:2px;">6+</p>
            <p style="font-size:11px;color:#475569;">Features</p>
          </td>
          <td style="width:33.3%;padding:20px 0;text-align:center;border-right:1px solid rgba(255,255,255,0.05);">
            <p style="font-size:22px;font-weight:800;color:#818cf8;margin-bottom:2px;">∞</p>
            <p style="font-size:11px;color:#475569;">Connections</p>
          </td>
          <td style="width:33.3%;padding:20px 0;text-align:center;">
            <p style="font-size:22px;font-weight:800;color:#c4b5fd;margin-bottom:2px;">AI</p>
            <p style="font-size:11px;color:#475569;">Powered</p>
          </td>
        </tr>
      </table>

      <!-- Body -->
      <div style="padding:40px 40px 32px;">

        <!-- Greeting -->
        <p style="font-size:15px;color:#94a3b8;line-height:1.75;margin-bottom:36px;">
          Hey <strong style="color:#f1f5f9;">${firstName}</strong>, your account <span style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);border-radius:6px;padding:2px 8px;color:#c4b5fd;font-weight:600;font-family:'Courier New',monospace;font-size:13px;">@${username || toEmail.split('@')[0]}</span> is all set. Here's everything waiting for you:
        </p>

        <!-- Feature label -->
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#334155;margin-bottom:20px;">What you can do</p>

        <!-- Features table -->
        <table width="100%" cellpadding="0" cellspacing="0">
          ${featureRows}
        </table>

        <!-- Divider -->
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);margin:28px 0;"></div>

        <!-- CTA Button -->
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#334155;text-align:center;margin-bottom:18px;">Ready to dive in?</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#6366f1 100%);color:#ffffff;text-decoration:none;padding:18px 56px;border-radius:14px;font-size:16px;font-weight:700;letter-spacing:0.2px;box-shadow:0 8px 32px rgba(124,58,237,0.35);">Go to CampusConnect &rarr;</a>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);margin:28px 0;"></div>

        <!-- Tips row -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:50%;padding-right:10px;vertical-align:top;">
              <div style="background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px;">
                <p style="font-size:13px;font-weight:700;color:#34d399;margin-bottom:6px;">✅ Pro tip</p>
                <p style="font-size:12px;color:#475569;line-height:1.5;">Complete your profile to boost your campus reputation and get discovered by peers.</p>
              </div>
            </td>
            <td style="width:50%;padding-left:10px;vertical-align:top;">
              <div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:16px;">
                <p style="font-size:13px;font-weight:700;color:#818cf8;margin-bottom:6px;">🔔 Stay updated</p>
                <p style="font-size:12px;color:#475569;line-height:1.5;">Enable notifications in Settings to never miss an event or poll on your campus.</p>
              </div>
            </td>
          </tr>
        </table>

      </div>

      <!-- Footer -->
      <div style="padding:28px 40px;border-top:1px solid rgba(255,255,255,0.04);background:rgba(0,0,0,0.3);">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:500;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.18);color:#34d399;margin-right:8px;">🔒 Firebase Secured</span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:500;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.18);color:#818cf8;">✉️ Official Email</span>
        </div>
        <p style="text-align:center;font-size:12px;color:#334155;line-height:1.7;">
          Sent by CampusConnect &middot; <a href="mailto:${process.env.EMAIL_USER}" style="color:#4f46e5;text-decoration:none;">${process.env.EMAIL_USER}</a>
        </p>
        <div style="height:1px;background:rgba(255,255,255,0.04);margin:14px 0;"></div>
        <p style="text-align:center;font-size:11px;color:#1e293b;line-height:1.6;">
          &copy; ${year} CampusConnect. All rights reserved.<br/>
          You received this because you just created an account on CampusConnect.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎓 Welcome to CampusConnect, ${firstName}!`,
    html: htmlTemplate,
    text: `Hi ${firstName},\n\nWelcome to CampusConnect! Your account (@${username || toEmail.split('@')[0]}) is all set.\n\nHere's what you can do:\n• Campus Feed — post updates and connect\n• Live Polls — get instant community reactions\n• Events — discover fests and workshops\n• Leaderboard — earn reputation points\n• Direct Messages — chat with classmates\n• AI Assistant — powered by Gemini AI\n\nVisit us at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n\n— CampusConnect Team`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`🎓 Welcome email sent to ${toEmail} [${info.messageId}]`);
  return info;
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };

