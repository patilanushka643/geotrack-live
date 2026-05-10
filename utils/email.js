const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function getBrevoApiKey() {
  return String(process.env.BREVO_API_KEY || "").trim();
}

function getSenderEmail() {
  return String(process.env.EMAIL_USER || "").trim();
}

function createBrevoRequestBody({ to, subject, html }) {
  return {
    sender: {
      email: getSenderEmail(),
      name: process.env.EMAIL_FROM_NAME || "GeoTrack",
    },
    to: [{ email: String(to || "").trim() }],
    subject,
    htmlContent: html,
  };
}

async function sendEmail({ to, subject, html }) {
  const apiKey = getBrevoApiKey();
  const senderEmail = getSenderEmail();

  try {
    if (!apiKey) {
      const error = new Error("Missing BREVO_API_KEY environment variable");
      error.code = "MISSING_BREVO_API_KEY";
      throw error;
    }

    if (!senderEmail) {
      const error = new Error("Missing EMAIL_USER environment variable for Brevo sender email");
      error.code = "MISSING_EMAIL_USER";
      throw error;
    }

    if (typeof fetch !== "function") {
      const error = new Error("Global fetch is not available in this Node.js runtime");
      error.code = "FETCH_UNAVAILABLE";
      throw error;
    }

    const payload = createBrevoRequestBody({ to, subject, html });
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let parsedResponse = null;
    if (responseText) {
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = responseText;
      }
    }

    if (!response.ok) {
      const error = new Error(
        `Brevo email request failed with status ${response.status}${responseText ? `: ${responseText}` : ""}`
      );
      error.code = "BREVO_API_ERROR";
      error.status = response.status;
      error.response = parsedResponse;
      throw error;
    }

    return {
      ok: true,
      status: response.status,
      response: parsedResponse,
      provider: "brevo",
    };
  } catch (error) {
    console.error("❌ Brevo sendEmail failed:", {
      message: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      apiKeySet: Boolean(process.env.BREVO_API_KEY),
      senderEmailSet: Boolean(process.env.EMAIL_USER),
      endpoint: BREVO_ENDPOINT,
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

