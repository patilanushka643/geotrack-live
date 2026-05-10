const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = (process.env.EMAIL_SECURE || "true").toString() === "true";

  // If credentials are missing, return a stub transporter whose sendMail
  // method rejects asynchronously. This prevents synchronous throws so
  // callers (like `sendEmail` and `sendOtp`) can catch and handle failures
  // without crashing the process or leaving inconsistent DB state.
  if (!user || !pass) {
    cachedTransporter = {
      sendMail: async () => {
        const err = new Error("Missing EMAIL_USER or EMAIL_PASS environment variables");
        err.code = "MISSING_EMAIL_CREDS";
        throw err;
      },
    };
    return cachedTransporter;
  }

  const transportConfig = {
    host,
    port,
    secure,
    auth: { user, pass },
  };

  cachedTransporter = nodemailer.createTransport(transportConfig);

  return cachedTransporter;
}

async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  try {
    return await transporter.sendMail({ from, to, subject, html });
  } catch (error) {
    console.error("❌ Nodemailer sendMail failed:", {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      authUserSet: Boolean(process.env.EMAIL_USER),
      authPassSet: Boolean(process.env.EMAIL_PASS),
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });
    throw error;
  }
}

function geoTrackOtpEmailHtml({ title, heading, description, otp, note }) {
  return `
    <div style="font-family: Arial, sans-serif; background: linear-gradient(180deg, #0f172a 0%, #111827 100%); color: #ffffff; padding: 24px; border-radius: 14px; border: 1px solid #1f2937;">
      <div style="display:inline-block; padding: 6px 10px; border-radius: 999px; background: rgba(59, 130, 246, 0.15); color: #93c5fd; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">GeoTrack</div>
      <h2 style="color: #ffffff; margin: 16px 0 12px; font-size: 22px;">${title}</h2>
      <p style="color: #cbd5e1; margin: 0 0 10px; line-height: 1.6;">${heading}</p>
      <p style="color: #94a3b8; margin: 0 0 18px; line-height: 1.6;">${description}</p>
      <div style="background: #0b1220; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; text-align: center; letter-spacing: 10px; font-size: 30px; font-weight: 700; color: #34d399;">${otp}</div>
      <p style="color: #cbd5e1; margin: 18px 0 8px;">This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color: #94a3b8; margin: 0;">${note}</p>
      <hr style="border: 0; border-top: 1px solid #1f2937; margin: 22px 0;">
      <p style="font-size: 12px; color: #64748b; margin: 0;">© 2026 GeoTrack. All rights reserved.</p>
    </div>
  `;
}

function otpEmailHtml({ otp }) {
  return geoTrackOtpEmailHtml({
    title: "Verify Your GeoTrack Account",
    heading: "Use the one-time password below to verify your email address and continue with signup.",
    description: "If you did not request this code, you can safely ignore this email.",
    otp,
    note: "This message was sent automatically from GeoTrack using Gmail SMTP.",
  });
}

function passwordResetOtpEmailHtml({ otp }) {
  return geoTrackOtpEmailHtml({
    title: "GeoTrack Password Reset",
    heading: "Use the one-time password below to continue resetting your password.",
    description: "If you did not request a password reset, ignore this email and keep your account secure.",
    otp,
    note: "For security, this code expires automatically and can only be used once.",
  });
}

module.exports = { sendEmail, otpEmailHtml, passwordResetOtpEmailHtml };

