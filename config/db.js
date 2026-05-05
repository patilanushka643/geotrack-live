const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }

  if (isConnected) return mongoose.connection;

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 5000),
  });
  isConnected = true;
  return mongoose.connection;
}

module.exports = { connectDB };

