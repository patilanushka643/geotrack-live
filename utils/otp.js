const crypto = require("crypto");

function generateOTP6() {
  // cryptographically strong uniform 6-digit OTP
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

function hashOTP(otp) {
  const secret = process.env.OTP_SECRET || "";
  return crypto.createHmac("sha256", secret).update(String(otp)).digest("hex");
}

module.exports = { generateOTP6, hashOTP };

