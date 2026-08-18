const nodemailer = require('nodemailer');
const path = require('path');

// Path to the logo file — resolved from this file's location
const LOGO_PATH = path.resolve(__dirname, '../../frontend/public/favicon.png');

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false = STARTTLS (required on Render free tier — port 465 is blocked)
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// ─── Shared logo attachment (CID) ───────────────────────────────────────────
// Using CID is the most reliable cross-client way to embed images in emails.
const logoAttachment = {
  filename: 'logo.png',
  path: LOGO_PATH,
  cid: 'campusconnect_logo',   // referenced in HTML as cid:campusconnect_logo
};

// ─── Shared CSS (light theme — works in ALL email clients) ──────────────────
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f1f5f9; margin:0; padding:0; }
  .pre { display:none !important; max-height:0; overflow:hidden; }
`;

// ─── Shared email wrapper ────────────────────────────────────────────────────
const wrap = (innerHtml) => `
  <div style="background:#f1f5f9;padding:40px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      ${innerHtml}
      <!-- Footer -->
      <div style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <div style="margin-bottom:12px;">
          <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;margin-right:6px;">🔒 Firebase Secured</span>
          <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;background:#eff6ff;border:1px solid #bfdbfe;color:#3b82f6;">✉️ Official Mail</span>
        </div>
        <p style="font-size:11px;color:#94a3b8;line-height:1.7;">&copy; ${new Date().getFullYear()} CampusConnect &middot; All rights reserved</p>
      </div>
    </div>
    <!-- Bottom branding -->
    <p style="text-align:center;margin-top:20px;font-size:11px;color:#94a3b8;">CampusConnect &mdash; Your Campus, Connected.</p>
  </div>
`;

// ─── Purple gradient header ──────────────────────────────────────────────────
const header = (title, subtitle) => `
  <!-- Purple gradient header -->
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 40px 36px;text-align:center;">
    <!-- Logo via CID -->
    <img src="cid:campusconnect_logo" width="72" height="72" alt="CampusConnect"
      style="border-radius:16px;display:block;margin:0 auto 16px;border:3px solid rgba(255,255,255,0.3);box-shadow:0 4px 20px rgba(0,0,0,0.3);" />
    <p style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:12px;">CampusConnect</p>
    <h1 style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;margin-bottom:8px;">${title}</h1>
    <p style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.5;">${subtitle}</p>
  </div>
`;

// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD RESET EMAIL
// ═══════════════════════════════════════════════════════════════════════════
const sendPasswordResetEmail = async (toEmail, resetLink, displayName = '') => {
  const transporter = createTransporter();
  const firstName = displayName ? displayName.split(' ')[0] : 'there';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Reset Your Password</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <span class="pre">Reset your CampusConnect Password — link expires in 1 hour.</span>
  ${wrap(`
    ${header('Reset Your Password', 'A password reset request was requested form your account')}

    <!-- Body -->
    <div style="padding:36px 40px;">

      <p style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:8px;">Hey ${firstName}! 👋</p>
      <p style="font-size:14px;color:#64748b;line-height:1.8;margin-bottom:8px;">
        We received a request to reset the Password for your CampusConnect account.
      </p>
      <p style="font-size:14px;color:#64748b;line-height:1.8;margin-bottom:28px;">
        Account: <span style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:2px 10px;color:#6d28d9;font-weight:700;font-family:monospace;font-size:13px;">${toEmail}</span>
      </p>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr><td align="center">
          <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(79,70,229,0.4);">
            🔐 &nbsp;Reset My Password
          </a>
        </td></tr>
      </table>

      <!-- Steps -->
      <p style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;">How it works</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="width:33%;padding:14px 10px;text-align:center;border-right:1px solid #e2e8f0;">
            <div style="width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;font-size:12px;font-weight:800;color:#fff;text-align:center;line-height:28px;margin:0 auto 8px;">1</div>
            <p style="font-size:12px;color:#1e293b;font-weight:600;">Click button</p>
          </td>
          <td style="width:33%;padding:14px 10px;text-align:center;border-right:1px solid #e2e8f0;">
            <div style="width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;font-size:12px;font-weight:800;color:#fff;text-align:center;line-height:28px;margin:0 auto 8px;">2</div>
            <p style="font-size:12px;color:#1e293b;font-weight:600;">New Password</p>
          </td>
          <td style="width:33%;padding:14px 10px;text-align:center;">
            <div style="width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;font-size:12px;font-weight:800;color:#fff;text-align:center;line-height:28px;margin:0 auto 8px;">3</div>
            <p style="font-size:12px;color:#1e293b;font-weight:600;">Sign in</p>
          </td>
        </tr>
      </table>

      <!-- Expiry notice -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:34px;vertical-align:middle;font-size:22px;">⏰</td>
          <td style="vertical-align:middle;padding-left:10px;">
            <p style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:2px;">Expires in 1 hour</p>
            <p style="font-size:12px;color:#a16207;line-height:1.5;">After expiry, request a new reset link from the login page.</p>
          </td>
        </tr></table>
      </div>

      <!-- Link fallback -->
      <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;">Button not working? Copy this link</p>
        <a href="${resetLink}" style="font-size:11px;color:#6d28d9;word-break:break-all;text-decoration:none;line-height:1.6;">${resetLink}</a>
      </div>

      <!-- Ignore note -->
      <p style="font-size:12px;color:#94a3b8;text-align:center;line-height:1.7;">
        🛡️ Didn't request a password reset? <strong style="color:#64748b;">Just ignore this email</strong> — your account is safe.
      </p>
    </div>
  `)}
</body>
</html>`;

  await transporter.sendMail({
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Reset your CampusConnect Password',
    html,
    attachments: [logoAttachment],
    text: `Hi ${firstName},\n\nReset your CampusConnect Password (expires in 1 hour):\n${resetLink}\n\nIgnore this if you didn't request it.\n\n— CampusConnect`,
  });
};


// ═══════════════════════════════════════════════════════════════════════════
// WELCOME EMAIL — sent once on first registration
// ═══════════════════════════════════════════════════════════════════════════
const sendWelcomeEmail = async (toEmail, displayName = '', username = '') => {
  const transporter = createTransporter();
  const firstName = displayName ? displayName.split(' ')[0] : 'there';
  const handle = username || toEmail.split('@')[0];

  const features = [
    { icon: '📢', title: 'Campus Feed',     desc: 'Post updates, share memes, ask questions — your campus timeline.' },
    { icon: '📊', title: 'Live Polls',      desc: 'Create polls and get instant reactions from the campus.' },
    { icon: '🎉', title: 'Events',          desc: 'Discover fests, workshops and club events. RSVP in one tap.' },
    { icon: '🏆', title: 'Leaderboard',     desc: 'Earn reputation points. Climb the campus rankings.' },
    { icon: '💬', title: 'Messages',        desc: 'Chat privately with classmates and club members.' },
    { icon: '🤖', title: 'AI Assistant',    desc: 'Powered by Gemini AI — smart summaries and suggestions.' },
  ];

  const featureRows = features.map(f => `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:48px;vertical-align:top;">
            <div style="width:40px;height:40px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;text-align:center;line-height:40px;font-size:19px;">${f.icon}</div>
          </td>
          <td style="vertical-align:middle;padding-left:14px;">
            <p style="font-size:14px;font-weight:700;color:#1e293b;margin:0 0 2px;">${f.title}</p>
            <p style="font-size:12px;color:#64748b;margin:0;line-height:1.5;">${f.desc}</p>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to CampusConnect!</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <span class="pre">Welcome to CampusConnect, ${firstName}! Your campus life starts here.</span>
  ${wrap(`
    ${header('Welcome aboard,<br/>' + firstName + '! 🎓', "You've joined your campus community — let's get you started")}

    <!-- Stats strip -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f1f5f9;">
      <tr>
        <td style="width:33%;padding:16px 0;text-align:center;border-right:1px solid #f1f5f9;">
          <p style="font-size:20px;font-weight:800;color:#4f46e5;margin-bottom:2px;">6+</p>
          <p style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Features</p>
        </td>
        <td style="width:33%;padding:16px 0;text-align:center;border-right:1px solid #f1f5f9;">
          <p style="font-size:20px;font-weight:800;color:#7c3aed;margin-bottom:2px;">∞</p>
          <p style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Connections</p>
        </td>
        <td style="width:33%;padding:16px 0;text-align:center;">
          <p style="font-size:20px;font-weight:800;color:#059669;margin-bottom:2px;">AI</p>
          <p style="font-size:10px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;">Powered</p>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <div style="padding:36px 40px;">

      <p style="font-size:14px;color:#64748b;line-height:1.8;margin-bottom:8px;">
        Hey <strong style="color:#1e293b;">${firstName}</strong>, your account
        <span style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:2px 10px;color:#6d28d9;font-weight:700;font-family:monospace;font-size:12px;">@${handle}</span>
        is all set. Here's everything waiting for you:
      </p>

      <div style="height:1px;background:#f1f5f9;margin:24px 0;"></div>

      <p style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:16px;">What you can do</p>
      <table width="100%" cellpadding="0" cellspacing="0">${featureRows}</table>

      <div style="height:1px;background:#f1f5f9;margin:8px 0 24px;"></div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr><td align="center">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(79,70,229,0.4);">
            Go to CampusConnect &rarr;
          </a>
        </td></tr>
      </table>

      <!-- Tips -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:8px;vertical-align:top;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;">
              <p style="font-size:12px;font-weight:700;color:#16a34a;margin-bottom:5px;">✅ Pro tip</p>
              <p style="font-size:11px;color:#4b5563;line-height:1.5;">Complete your profile to get discovered by peers.</p>
            </div>
          </td>
          <td style="width:50%;padding-left:8px;vertical-align:top;">
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;">
              <p style="font-size:12px;font-weight:700;color:#2563eb;margin-bottom:5px;">🔔 Stay updated</p>
              <p style="font-size:11px;color:#4b5563;line-height:1.5;">Enable notifications to never miss events or polls.</p>
            </div>
          </td>
        </tr>
      </table>

    </div>
  `)}
</body>
</html>`;

  await transporter.sendMail({
    from: `"CampusConnect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🎓 Welcome to CampusConnect, ${firstName}!`,
    html,
    attachments: [logoAttachment],
    text: `Hi ${firstName},\n\nWelcome to CampusConnect! Your account (@${handle}) is all set.\n\nVisit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n\n— CampusConnect`,
  });
};


module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
