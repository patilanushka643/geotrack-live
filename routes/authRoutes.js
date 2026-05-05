const express = require("express");
const {
  sendOtp,
  verifyOtp,
  register,
  checkSession,
  login,
  logout,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// Existing auth routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check-session/:email", checkSession);

// Forgot Password routes
router.post("/forgot-password", sendPasswordResetOtp);
router.post("/verify-reset-otp", verifyPasswordResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;

