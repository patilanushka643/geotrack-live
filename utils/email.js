const nodemailer = require("nodemailer");

let cachedTransporter = null;

function toBoolean(value) {
  return String(value).toLowerCase() === "true";
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER || process.env.EMAIL_USERNAME;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE ? toBoolean(process.env.EMAIL_SECURE) : port === 465;
  const service = process.env.EMAIL_SERVICE || (!host ? "gmail" : undefined);

  if (!user || !pass) {
    throw new Error("Missing email credentials. Set EMAIL_USER (or EMAIL_USERNAME) and EMAIL_PASS (or EMAIL_PASSWORD).");
  }

  const transportConfig = service
    ? { service, auth: { user, pass } }
    : {
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
      authPassSet: Boolean(process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD),
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      service: process.env.EMAIL_SERVICE || (process.env.EMAIL_HOST ? undefined : "gmail"),
    });
    throw error;
  }
}

function otpEmailHtml({ otp }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #ffffff; padding: 20px; border-radius: 10px;">
      <h2 style="color: #3b82f6;">GeoTrack Email Verification</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="background: #1e293b; padding: 20px; border-radius: 8px; letter-spacing: 5px; color: #10b981;">${otp}</h1>
      <p style="color: #94a3b8;">⏱️ This OTP is valid for <strong>5 minutes</strong> only.</p>
      <p style="color: #94a3b8;">If you didn't request this, please ignore this email.</p>
      <hr style="border: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #475569;">© 2026 GeoTrack. All rights reserved.</p>
    </div>
  `;
}

function passwordResetOtpEmailHtml({ otp }) {
  return `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #ffffff; padding: 20px; border-radius: 10px;">
      <h2 style="color: #3b82f6;">GeoTrack Password Reset</h2>
      <p>You requested to reset your password. Use the OTP below to proceed:</p>
      <h1 style="background: #1e293b; padding: 20px; border-radius: 8px; letter-spacing: 5px; color: #10b981;">${otp}</h1>
      <p style="color: #94a3b8;">⏱️ This OTP is valid for <strong>5 minutes</strong> only.</p>
      <p style="color: #f87171;"><strong>⚠️ Important:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
      <hr style="border: 1px solid #334155; margin: 20px 0;">
      <p style="font-size: 12px; color: #475569;">© 2026 GeoTrack. All rights reserved.</p>
    </div>
  `;
}

module.exports = { sendEmail, otpEmailHtml, passwordResetOtpEmailHtml };

