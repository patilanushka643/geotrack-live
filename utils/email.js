const nodemailer = require("nodemailer");

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE || "gmail";

  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER / EMAIL_PASS in environment variables.");
  }

  cachedTransporter = nodemailer.createTransport({
    service,
    auth: { user, pass },
  });

  return cachedTransporter;
}

async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await transporter.sendMail({ from, to, subject, html });
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

