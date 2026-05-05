const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateOTP6, hashOTP } = require("../utils/otp");
const { sendEmail, otpEmailHtml, passwordResetOtpEmailHtml } = require("../utils/email");

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

async function sendOtp(req, res) {
  try {
    const emailRaw = req.body?.email;
    const type = req.body?.type || "signup";
    const email = String(emailRaw || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Atomic "get or create" to support concurrent OTP requests safely
    let user = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, isVerified: false } },
      { upsert: true, returnDocument: "after" }
    );

    // cooldown
    if (user.otpLastSentAt) {
      const elapsed = Date.now() - user.otpLastSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfter} seconds before requesting a new OTP`,
          retryAfter,
        });
      }
    }

    const otp = generateOTP6();
    const otpHashed = hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    user.otp = otpHashed;
    user.otpExpiry = otpExpiry;
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    user.isVerified = false; // require fresh verification on each OTP send
    await user.save();

    // 🔐 DEBUG: Log OTP for testing (remove in production)
    console.log(`\n🔐 OTP for ${email}: ${otp}\n`);

    await sendEmail({
      to: email,
      subject: "🔐 GeoTrack OTP Verification",
      html: otpEmailHtml({ otp }),
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${email}`,
      expiresIn: Math.floor(OTP_TTL_MS / 1000),
      type,
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function verifyOtp(req, res) {
  try {
    const emailRaw = req.body?.email;
    const otpRaw = req.body?.otp;
    const email = String(emailRaw || "").trim().toLowerCase();
    const otp = String(otpRaw || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(401).json({
        success: false,
        message: "No OTP found for this email. Please request a new one.",
      });
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(401).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(429).json({
        success: false,
        message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
      });
    }

    const incomingHash = hashOTP(otp);
    if (incomingHash !== user.otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - user.otpAttempts);
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. You have ${attemptsLeft} attempts remaining.`,
        attemptsLeft,
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
      token: email, // keeping existing frontend expectation; replace with JWT later if needed
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function register(req, res) {
  try {
    const emailRaw = req.body?.email;
    const fullName = String(req.body?.fullName || "").trim();
    const userId = String(req.body?.userId || "").trim();
    const password = String(req.body?.password || "");
    const email = String(emailRaw || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(401).json({ success: false, message: "Email not verified" });
    }

    if (!fullName || !userId || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // prevent duplicate userId if used
    const existingUserId = await User.findOne({ userId, _id: { $ne: user._id } });
    if (existingUserId) {
      return res.status(409).json({ success: false, message: "User ID already taken" });
    }

    user.fullName = fullName;
    user.userId = userId;
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Registration completed successfully!",
      user: { email, fullName, userId },
    });
  } catch (error) {
    console.error("Error in register:", error);
    // handle unique index conflicts
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

async function checkSession(req, res) {
  try {
    const email = String(req.params?.email || "").trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      return res.status(200).json({ success: true, verified: false });
    }
    const user = await User.findOne({ email }).select("isVerified");
    return res.status(200).json({ success: true, verified: Boolean(user?.isVerified) });
  } catch (error) {
    console.error("Error in checkSession:", error);
    return res.status(200).json({ success: true, verified: false });
  }
}

/**
 * Login endpoint - validates email, password, and verification status
 * Generates JWT token on successful login
 */
async function login(req, res) {
  try {
    const emailRaw = req.body?.email;
    const password = String(req.body?.password || "");
    const email = String(emailRaw || "").trim().toLowerCase();

    // Validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account does not exist. Please sign up first.",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Email not verified. Please verify your email first.",
      });
    }

    // Check if user has completed registration (has password)
    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Account not fully registered. Please complete your registration.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // Set user online status
    user.isOnline = true;
    user.lastSeenAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" } // Token expires in 7 days
    );

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        email: user.email,
        fullName: user.fullName,
        userId: user.userId,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Logout endpoint - clears auth token (client-side)
 * Server-side: just confirms logout
 */
async function logout(req, res) {
  try {
    // Token is typically cleared on the client side
    // This endpoint can be used to invalidate sessions on the server if needed
    res.clearCookie("authToken");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Forgot Password - Step 1: Send OTP to registered email
 * Validates email exists, generates OTP, and sends it
 */
async function sendPasswordResetOtp(req, res) {
  try {
    const emailRaw = req.body?.email;
    const email = String(emailRaw || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Check if user exists and is verified
    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if email exists
      return res.status(404).json({
        success: false,
        message: "If this email exists in our system, you will receive an OTP shortly.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "This email has not been verified. Please complete the signup process first.",
      });
    }

    // Check cooldown for resend
    if (user.passwordResetOtpLastSentAt) {
      const elapsed = Date.now() - user.passwordResetOtpLastSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${retryAfter} seconds before requesting a new OTP`,
          retryAfter,
        });
      }
    }

    // Generate OTP for password reset
    const otp = generateOTP6();
    const otpHashed = hashOTP(otp);
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    user.passwordResetOtp = otpHashed;
    user.passwordResetOtpExpiry = otpExpiry;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = new Date();
    user.isPasswordResetVerified = false;
    await user.save();

    // 🔐 DEBUG: Log OTP for testing (remove in production)
    console.log(`\n🔐 Password Reset OTP for ${email}: ${otp}\n`);

    await sendEmail({
      to: email,
      subject: "🔐 GeoTrack Password Reset OTP",
      html: passwordResetOtpEmailHtml({ otp }),
    });

    return res.status(200).json({
      success: true,
      message: `Password reset OTP sent to ${email}`,
      expiresIn: Math.floor(OTP_TTL_MS / 1000),
    });
  } catch (error) {
    console.error("Error in sendPasswordResetOtp:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Forgot Password - Step 2: Verify OTP for password reset
 * Validates OTP and marks user as ready for password reset
 */
async function verifyPasswordResetOtp(req, res) {
  try {
    const emailRaw = req.body?.email;
    const otpRaw = req.body?.otp;
    const email = String(emailRaw || "").trim().toLowerCase();
    const otp = String(otpRaw || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiry) {
      return res.status(401).json({
        success: false,
        message: "No password reset OTP found. Please request a new one.",
      });
    }

    // Check if OTP has expired
    if (Date.now() > user.passwordResetOtpExpiry.getTime()) {
      user.passwordResetOtp = null;
      user.passwordResetOtpExpiry = null;
      user.passwordResetOtpAttempts = 0;
      user.isPasswordResetVerified = false;
      await user.save();
      return res.status(401).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Check if max attempts exceeded
    if ((user.passwordResetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      user.passwordResetOtp = null;
      user.passwordResetOtpExpiry = null;
      user.passwordResetOtpAttempts = 0;
      user.isPasswordResetVerified = false;
      await user.save();
      return res.status(429).json({
        success: false,
        message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
      });
    }

    // Verify OTP
    const incomingHash = hashOTP(otp);
    if (incomingHash !== user.passwordResetOtp) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - user.passwordResetOtpAttempts);
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. You have ${attemptsLeft} attempts remaining.`,
        attemptsLeft,
      });
    }

    // Mark as verified - ready for password reset
    user.isPasswordResetVerified = true;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpiry = null;
    user.passwordResetOtpAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully! You can now reset your password.",
      email,
    });
  } catch (error) {
    console.error("Error in verifyPasswordResetOtp:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Forgot Password - Step 3: Reset password
 * Updates password after OTP verification
 */
async function resetPassword(req, res) {
  try {
    const emailRaw = req.body?.email;
    const newPassword = String(req.body?.password || "");
    const email = String(emailRaw || "").trim().toLowerCase();

    // Validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify that OTP was verified
    if (!user.isPasswordResetVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your OTP first before resetting the password",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset flags
    user.passwordHash = hashedPassword;
    user.isPasswordResetVerified = false;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpiry = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSentAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! Please log in with your new password.",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  checkSession,
  login,
  logout,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
};

