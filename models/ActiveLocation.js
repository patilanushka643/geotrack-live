const mongoose = require("mongoose");

const ActiveLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    username: {
      type: String,
      default: "Unknown",
    },
    fullName: {
      type: String,
      default: "Unknown",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["online", "offline", "location-disabled"],
      default: "offline",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

ActiveLocationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ActiveLocation", ActiveLocationSchema);
