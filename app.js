const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const server = http.createServer(app);
const io = socketio(server);

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const friendRoutes = require("./routes/friendRoutes");
const { verifyAuth, checkAlreadyLoggedIn } = require("./middleware/authMiddleware");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ===== API ROUTES =====
app.use("/api", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/friends", friendRoutes);

// ===== PAGE ROUTES =====
// Login page - accessible only if not already logged in
app.get("/login", checkAlreadyLoggedIn, function (req, res) {
    res.render("login");
});

// Signup page - accessible only if not already logged in
app.get("/signup", checkAlreadyLoggedIn, function (req, res) {
    res.render("signup");
});

// Forgot Password pages
app.get("/forgot-password", checkAlreadyLoggedIn, function (req, res) {
    res.render("forgot-password");
});

app.get("/verify-reset-otp", checkAlreadyLoggedIn, function (req, res) {
    res.render("verify-reset-otp");
});

app.get("/reset-password", checkAlreadyLoggedIn, function (req, res) {
    res.render("reset-password");
});

// Home page - PROTECTED - requires authentication
app.get("/home", verifyAuth, function (req, res) {
    res.render("home", { user: req.user });
});

// Root path - redirect to home if logged in, otherwise to login
app.get("/", function (req, res) {
    try {
        const token = req.cookies?.authToken;
        if (!token) {
            return res.redirect("/login");
        }
        res.redirect("/home");
    } catch (error) {
        res.redirect("/login");
    }
});

// ===== SOCKET.IO EVENTS =====
const connectedUsers = {}; // Store user socket connections

io.on("connection", function (socket) {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their ID
    socket.on("user-join", function (data) {
        connectedUsers[data.userId] = socket.id;
        console.log(`📍 User ${data.userId} joined location sharing`);
        
        // Notify all connected users
        io.emit("user-joined", {
            userId: data.userId,
            username: data.username,
            timestamp: new Date(),
        });
    });

    // Send location update to all connected users
    socket.on("send-location", function (data) {
        console.log(`📍 Location from ${data.userId}:`, data);
        
        // Broadcast location to all connected clients
        io.emit("receive-location", {
            userId: data.userId,
            username: data.username,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            timestamp: new Date(),
        });
    });

    // Request location update from specific user
    socket.on("request-location", function (data) {
        const targetSocketId = connectedUsers[data.targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("location-requested", {
                requestedBy: data.requestedBy,
                requestedByUsername: data.requestedByUsername,
            });
        }
    });

    // Handle disconnect
    socket.on("disconnect", function () {
        // Find and remove user from connectedUsers
        for (let userId in connectedUsers) {
            if (connectedUsers[userId] === socket.id) {
                console.log(`🚪 User ${userId} disconnected`);
                io.emit("user-disconnected", {
                    userId,
                    timestamp: new Date(),
                });
                delete connectedUsers[userId];
                break;
            }
        }
    });
});

const port = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    console.log("✅ Database connected");

    // Ensure indexes match latest schema (fixes old userId unique index issues)
    const User = require("./models/User");
    try {
      await User.collection.dropIndex("userId_1");
    } catch (_) {
      // ignore if index doesn't exist
    }
    try {
      await User.collection.dropIndex("userId_unique_non_empty");
    } catch (_) {
      // ignore if index doesn't exist
    }
    await User.syncIndexes();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exitCode = 1;
    // Keep server from starting in a broken auth state
    return;
  }

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE || "gmail"}`);
  });
})();