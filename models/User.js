const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // OTP verification fields
    otp: { type: String, default: null }, // hashed OTP only
    otpExpiry: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },

    // Password reset fields
    passwordResetOtp: { type: String, default: null }, // hashed OTP for password reset
    passwordResetOtpExpiry: { type: Date, default: null },
    passwordResetOtpAttempts: { type: Number, default: 0 },
    passwordResetOtpLastSentAt: { type: Date, default: null },
    isPasswordResetVerified: { type: Boolean, default: false },

    // Existing/optional profile fields used by current frontend flow
    fullName: { type: String, default: "" },
    userId: { type: String, default: null },
    passwordHash: { type: String, default: "" },

    // Location tracking fields
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    locationLastUpdated: { type: Date, default: null },
    isLocationSharing: { type: Boolean, default: false },

    // Friend list fields
    friendList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Unique userId only when it is a non-empty string.
UserSchema.index(
  { userId: 1 },
  {
    unique: true,
    name: "userId_unique_non_empty",
    // partial indexes don't reliably support $ne on all servers; $gt "" achieves "non-empty"
    partialFilterExpression: { userId: { $type: "string", $gt: "" } },
  }
);

module.exports = mongoose.model("User", UserSchema);

