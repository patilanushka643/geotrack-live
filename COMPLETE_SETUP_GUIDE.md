# 🌍 GeoTrack - Real-Time Multi-User Location Tracking

## Complete Setup and Deployment Guide

**Version**: 2.0 | **Last Updated**: May 2026 | **Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [API Documentation](#api-documentation)
8. [Socket.IO Events](#socketio-events)
9. [Frontend Features](#frontend-features)
10. [Troubleshooting](#troubleshooting)
11. [Production Deployment](#production-deployment)

---

## 📌 Project Overview

**GeoTrack** is a real-time multi-user location tracking web application that allows users to:
- Track their live GPS location (using browser's Geolocation API)
- View all connected users' locations on an interactive map
- Receive real-time location updates via Socket.IO
- Manage friend connections and view friend statuses
- Experience throttled location updates (every 5 seconds)
- See online/offline/stale status for all users

### Core Features ✨
- ✅ **Real-Time Location Sharing** via Socket.IO
- ✅ **Multi-User Location Tracking** on Leaflet.js map
- ✅ **Friend Management System** with add/remove/request
- ✅ **Email-Based OTP Authentication** (6-digit, 5-min expiry)
- ✅ **Location History Tracking** in MongoDB
- ✅ **User Status Indicators** (Online/Stale/Offline)
- ✅ **Responsive UI** for desktop, tablet, mobile
- ✅ **No Maps API Key Required** (uses OpenStreetMap)
- ✅ **JWT Token-Based Sessions** (7-day expiry)
- ✅ **Throttled Location Updates** (5-second intervals)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│         CLIENT (Browser)                 │
│  - Leaflet.js Map Display               │
│  - Geolocation API (watchPosition)      │
│  - Socket.IO Real-time Events           │
│  - EJS Template Rendering               │
└────────────┬────────────────────────────┘
             │ HTTP/WebSocket
┌────────────▼────────────────────────────┐
│      EXPRESS SERVER (Node.js)            │
│  - REST API Endpoints                   │
│  - Socket.IO Event Handlers             │
│  - JWT Authentication                   │
│  - OTP Email Service                    │
└────────────┬────────────────────────────┘
             │ Database Queries
┌────────────▼────────────────────────────┐
│      MONGODB (Atlas/Local)               │
│  - Users Collection                     │
│  - LocationHistory Collection           │
│  - Friendship Collection                │
└─────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML, CSS, JavaScript, EJS | Latest |
| **Backend** | Node.js, Express.js | 5.x, 4.x+ |
| **Real-Time** | Socket.IO | 4.8.3 |
| **Mapping** | Leaflet.js | 1.9.4 |
| **Database** | MongoDB, Mongoose | 9.5.0 |
| **Authentication** | JWT, bcryptjs | 3.0.3 |
| **Email** | Nodemailer | 6.9.7 |

---

## 📋 Prerequisites

### System Requirements
- **Node.js** v14+ (v16+ recommended)
- **npm** v6+ or **yarn**
- **MongoDB** v4.4+ (Local or Atlas Cloud)
- **Modern Web Browser** with Geolocation API support

### Required Accounts
1. **MongoDB Atlas Account** (free tier available)
   - Create database cluster
   - Get connection string
   - Add IP to whitelist (or 0.0.0.0/0 for development)

2. **Email Service** (choose one)
   - Gmail + App Password
   - SendGrid (free tier)
   - Mailtrap (free tier)
   - Any SMTP service

---

## 🚀 Installation

### Step 1: Clone/Navigate to Project

```bash
# If you haven't already, create project directory
cd "path/to/project"
ls -la  # Verify project files exist
```

### Step 2: Install Dependencies

```bash
# Clean install if needed
rm -rf node_modules package-lock.json

# Install all packages
npm install

# Verify installation
npm list | head -20
```

**Key Packages Installed:**
- `express` - Web framework
- `socket.io` - Real-time communication
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables
- `nodemailer` - Email service
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `ejs` - Template engine
- `leaflet` - Map library (frontend)

### Step 3: Verify Project Structure

```
project/
├── app.js                          # Main server file
├── package.json                    # Dependencies
├── config/
│   └── db.js                       # MongoDB connection
├── models/
│   ├── User.js                     # User schema
│   ├── LocationHistory.js          # Location tracking
│   └── Friendship.js               # Friend relationships
├── controllers/
│   ├── authController.js           # Auth logic
│   ├── locationController.js       # Location API
│   └── friendController.js         # Friend logic
├── routes/
│   ├── authRoutes.js               # Auth endpoints
│   ├── locationRoutes.js           # Location endpoints
│   └── friendRoutes.js             # Friend endpoints
├── middleware/
│   └── authMiddleware.js           # JWT verification
├── public/
│   ├── css/
│   │   └── style.css               # Main styles
│   └── js/
│       └── script.js               # Frontend logic
├── views/
│   ├── home.ejs                    # Main map page
│   ├── login.ejs                   # Login page
│   ├── signup.ejs                  # Signup page
│   └── ...                         # Other EJS templates
└── utils/
    ├── email.js                    # Email utilities
    └── otp.js                      # OTP utilities
```

---

## ⚙️ Configuration

### Step 1: Create `.env` File

Create a new file named `.env` in the project root:

```bash
# Copy template
cat > .env << 'EOF'
# ===== SERVER CONFIGURATION =====
PORT=3000
NODE_ENV=development

# ===== MONGODB CONFIGURATION =====
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/geotrack?retryWrites=true&w=majority
MONGODB_TIMEOUT_MS=5000

# ===== JWT CONFIGURATION =====
JWT_SECRET=your_super_secret_key_min_32_characters_long_here_12345
JWT_EXPIRY=7d

# ===== EMAIL CONFIGURATION (Gmail Example) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password  # NOT your Gmail password!

# ===== OTP CONFIGURATION =====
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5

# ===== LOCATION TRACKING =====
LOCATION_UPDATE_INTERVAL=5000        # milliseconds
GPS_ACCURACY_REQUIREMENT=high        # high, best, balanced, low_power
ONLINE_THRESHOLD_SECONDS=60          # User online if updated <60s ago
STALE_THRESHOLD_MINUTES=5            # Location stale if >5 min old
EOF
```

### Step 2: Configure MongoDB

#### Option A: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up (free tier available)
   - Create organization & project

2. **Create Cluster**
   - Click "Create Deployment"
   - Choose "M0 Sandbox" (free)
   - Select region close to you
   - Click "Create Deployment"

3. **Get Connection String**
   - Go to "Databases" → Your Cluster → "Connect"
   - Choose "Drivers" → Node.js
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `myFirstDatabase` with `geotrack`

4. **Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` for development (or your IP)
   - Confirm

5. **Update `.env`**
   ```
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/geotrack?retryWrites=true&w=majority
   ```

#### Option B: Local MongoDB

```bash
# Install MongoDB Community Edition
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod  # Keep running in separate terminal

# Update .env
MONGODB_URI=mongodb://localhost:27017/geotrack
```

### Step 3: Configure Email Service

#### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Find "2-Step Verification" → Enable it

2. **Create App Password**
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password

3. **Update `.env`**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_char_app_password
   ```

#### Option B: Mailtrap (Easiest for Testing)

1. **Create Account**
   - Go to [mailtrap.io](https://mailtrap.io)
   - Sign up (free tier)
   - Create "Testing Inbox"

2. **Get Credentials**
   - Go to "Integrations" → "Nodemailer"
   - Copy host, port, user, password

3. **Update `.env`**
   ```
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_mailtrap_user
   EMAIL_PASS=your_mailtrap_pass
   ```

### Step 4: Generate JWT Secret

```bash
# Generate random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output to .env JWT_SECRET value
```

### Step 5: Verify Configuration

```bash
# Check all env vars are set
node -e "console.log(process.env.MONGODB_URI ? '✅ MongoDB' : '❌ MongoDB'); \
          console.log(process.env.JWT_SECRET ? '✅ JWT Secret' : '❌ JWT Secret'); \
          console.log(process.env.EMAIL_USER ? '✅ Email' : '❌ Email');" 2>&1 || echo "❌ Missing .env file"
```

---

## ▶️ Running the Application

### Option 1: Development Mode (with Auto-Restart)

```bash
# Install nodemon globally (if not already)
npm install -g nodemon

# Run with auto-restart on file changes
npm run dev

# Output should show:
# ✅ Database connected
# 🚀 Server running on http://localhost:3000
```

### Option 2: Production Mode

```bash
# Run without auto-restart
npm start

# Output should show:
# ✅ Database connected
# 🚀 Server running on http://localhost:3000
```

### Step-by-Step Usage

1. **Open Browser**
   ```
   http://localhost:3000
   ```
   Should redirect to login page

2. **Create Account**
   - Click "Sign Up"
   - Enter email address
   - Click "Send OTP"
   - Check email for 6-digit code
   - Enter OTP code
   - Click "Verify"
   - Enter Full Name and Username
   - Set Password
   - Click "Sign Up"

3. **Grant GPS Permission**
   - After login, browser will request location permission
   - Click "Allow" for the website to access your location
   - (Without permission, map shows but tracking doesn't work)

4. **View Map**
   - Green marker = Your current location
   - Blue markers = Other users' locations
   - Sidebar shows active users list
   - Click username to center map on that user

5. **Toggle Location Sharing**
   - Use switch in header to share/stop sharing location
   - Shared locations update every 5 seconds
   - Others see your marker update in real-time

### Terminal Output Reference

**Successful Startup:**
```
🚀 Location Sharing System Initialized
✅ Geolocation API available
✅ Leaflet Map initialized
📍 Location tracking started
✅ User {id} joined location sharing
📍 Location from {id}: {...}
receive-location event received: {...}
```

**Common Issues in Terminal:**
```
❌ ECONNREFUSED - MongoDB not running
❌ JWT verification failed - Check JWT_SECRET
❌ Email send failed - Check EMAIL credentials
⚠️ Permission denied (geolocation) - User denied GPS
```

---

## 📡 API Documentation

### Authentication Endpoints

#### 1. Send OTP
```
POST /api/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

#### 2. Verify OTP & Register
```
POST /api/verify-and-register
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "fullName": "John Doe",
  "userId": "johndoe",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "userId": "johndoe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Login
```
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Location Endpoints

#### 1. Update Current Location
```
POST /api/location/update
Headers: Cookie: authToken={jwt_token}
Content-Type: application/json

{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 5
}

Response:
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "lastUpdated": "2026-05-01T10:30:00.000Z"
  }
}
```

#### 2. Get All Users with Locations
```
GET /api/location/users
Headers: Cookie: authToken={jwt_token}

Response:
{
  "success": true,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "username": "johndoe",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "isOnline": true,
      "locationLastUpdated": "2026-05-01T10:30:00.000Z"
    },
    ...
  ]
}
```

#### 3. Get Active Users Only
```
GET /api/location/active
Headers: Cookie: authToken={jwt_token}

Response:
{
  "success": true,
  "activeUsers": [
    {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "isLocationSharing": true
    },
    ...
  ]
}
```

#### 4. Get Specific User Location
```
GET /api/location/user/:userId
Headers: Cookie: authToken={jwt_token}

Response:
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "isLocationSharing": true,
    "lastUpdated": "2026-05-01T10:30:00.000Z"
  }
}
```

#### 5. Toggle Location Sharing
```
POST /api/location/toggle-sharing
Headers: Cookie: authToken={jwt_token}
Content-Type: application/json

{
  "isSharing": true
}

Response:
{
  "success": true,
  "isLocationSharing": true,
  "message": "Location sharing enabled"
}
```

### Friend Endpoints

#### 1. Send Friend Request
```
POST /api/friends/request
Headers: Cookie: authToken={jwt_token}
Content-Type: application/json

{
  "friendId": "507f1f77bcf86cd799439012"
}

Response:
{
  "success": true,
  "message": "Friend request sent"
}
```

#### 2. Accept Friend Request
```
POST /api/friends/accept
Headers: Cookie: authToken={jwt_token}
Content-Type: application/json

{
  "friendId": "507f1f77bcf86cd799439012"
}

Response:
{
  "success": true,
  "message": "Friend request accepted"
}
```

#### 3. Get My Friends
```
GET /api/friends/my-friends
Headers: Cookie: authToken={jwt_token}

Response:
{
  "success": true,
  "friends": [
    {
      "id": "507f1f77bcf86cd799439012",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "latitude": 37.8044,
      "longitude": -122.2712,
      "isOnline": true
    },
    ...
  ]
}
```

---

## 🔌 Socket.IO Events

### Client → Server Events

#### 1. User Join (on login)
```javascript
socket.emit("user-join", {
  userId: "507f1f77bcf86cd799439011",
  username: "johndoe"
});
```

#### 2. Send Location (every 5 seconds)
```javascript
socket.emit("send-location", {
  userId: "507f1f77bcf86cd799439011",
  username: "johndoe",
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 5
});
```

#### 3. Update Online Status
```javascript
socket.emit("update-online-status", {
  userId: "507f1f77bcf86cd799439011",
  isOnline: true
});
```

#### 4. Heartbeat (keep-alive, every 30 seconds)
```javascript
socket.emit("heartbeat", {
  userId: "507f1f77bcf86cd799439011"
});
```

### Server → Client Events

#### 1. Receive Location Update
```javascript
socket.on("receive-location", function(data) {
  // data = {
  //   userId: "...",
  //   username: "...",
  //   latitude: 37.7749,
  //   longitude: -122.4194,
  //   accuracy: 5,
  //   timestamp: "2026-05-01T10:30:00Z"
  // }
});
```

#### 2. User Joined
```javascript
socket.on("user-joined", function(data) {
  // data = {
  //   userId: "...",
  //   username: "...",
  //   timestamp: "..."
  // }
});
```

#### 3. User Disconnected
```javascript
socket.on("user-disconnected", function(data) {
  // data = {
  //   userId: "...",
  //   timestamp: "..."
  // }
});
```

#### 4. User Status Changed
```javascript
socket.on("user-status-changed", function(data) {
  // data = {
  //   userId: "...",
  //   isOnline: true/false
  // }
});
```

---

## 🎨 Frontend Features

### Map Interface
- **Leaflet.js Map** centered on San Francisco (default)
- **User Markers** showing locations with custom colors
- **Popup Information** on marker click
- **Auto-Fit Map** to show all active users
- **Zoom & Pan** controls for navigation
- **Attribution** to OpenStreetMap contributors

### User Sidebar
- **Active Users List** with real-time updates
- **Online Status Badges** (🟢 Online, 🟡 Stale, 🔴 Offline)
- **User Avatars** with initials
- **Click to Center** on user location
- **User Count** showing total and online users

### Header Controls
- **Location Sharing Toggle** (Enable/Disable)
- **GPS Status** indicator
- **Last Update Time**
- **User Profile** dropdown

### Status Indicators
- 🟢 **Online**: Location updated <60 seconds ago
- 🟡 **Stale**: Location updated 60 seconds to 5 minutes ago
- 🔴 **Offline**: Location not updated for >5 minutes

### Marker Colors
- 🟩 **Green**: Your own location
- 🟦 **Blue**: Other users' locations
- Custom colors for friend locations (if friend system enabled)

---

## 🐛 Troubleshooting

### Database Issues

#### Problem: "ECONNREFUSED" on startup
**Cause**: MongoDB not running or wrong connection string

**Solution**:
```bash
# Check MongoDB is running
# If local: mongod should be running in another terminal
# If Atlas: Check internet connection and IP whitelist

# Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.log('❌', e.message))"
```

#### Problem: "MongoParseError: Invalid connection string"
**Cause**: Malformed MongoDB URI

**Solution**:
```
# Check format: mongodb+srv://username:password@host/database
# Ensure special characters in password are URL encoded
# Use: https://www.urlencoder.org/ if needed
```

### Authentication Issues

#### Problem: "JWT verification failed"
**Cause**: JWT_SECRET mismatch or token expired

**Solution**:
```bash
# Regenerate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with new secret
# Clear browser cookies: F12 → Application → Cookies → Delete
# Login again
```

#### Problem: "OTP not received in email"
**Cause**: Email credentials incorrect or spam filter

**Solution**:
```bash
# Test email config
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify((err, success) => {
  if (err) console.log('❌ Email Error:', err);
  else console.log('✅ Email Connected');
});
"

# Check spam folder
# If Gmail: Enable "Less Secure App Access" (old way)
# Or use 16-char App Password (new way - recommended)
```

### GPS/Location Issues

#### Problem: "GPS not supported" message
**Cause**: Browser doesn't support Geolocation API

**Solution**:
- Use Chrome, Firefox, Safari, or Edge (all support Geolocation)
- Ensure HTTPS or localhost (Geolocation requires secure context)
- Update browser to latest version

#### Problem: "Permission denied" GPS error
**Cause**: User denied location permission

**Solution**:
1. Click the lock icon in address bar
2. Find "Location" permission
3. Change to "Allow"
4. Refresh page

#### Problem: "Location accuracy is poor"
**Cause**: Weak GPS signal or set to low accuracy

**Solution**:
- Ensure "enableHighAccuracy: true" in code
- Go outdoors or near window
- Close buildings/tunnels interfere with GPS
- Wait 30+ seconds for GPS lock

### Socket.IO Issues

#### Problem: "WebSocket connection failed"
**Cause**: Server not running or port blocked

**Solution**:
```bash
# Verify server is running
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process on port
killall node  # Mac/Linux
taskkill /PID {PID} /F  # Windows

# Restart server
npm run dev
```

#### Problem: "Location not updating in real-time"
**Cause**: Socket.IO not connected or location not being sent

**Solution**:
```javascript
// In browser console (F12):
console.log(socket.connected);  // Should be true
console.log(window.isLocationSharingEnabled);  // Should be true

// Check network tab for socket.io handshake
// Should see "GET /socket.io/?transport=websocket"
```

### Performance Issues

#### Problem: "Map is slow with many users"
**Cause**: Too many markers/frequent updates

**Solution**:
- Limit active users displayed (use friend list only)
- Increase LOCATION_UPDATE_INTERVAL to 10000ms (10 seconds)
- Use marker clustering (optional enhancement)

#### Problem: "High CPU usage"
**Cause**: Frequent database queries or infinite loops

**Solution**:
- Check browser console for errors (F12)
- Verify watchPosition isn't called multiple times
- Check server logs for errors
- Restart server: `npm run dev`

---

## 🚀 Production Deployment

### Before Deploying

1. **Security Checklist**
   ```bash
   ✅ Change JWT_SECRET to new random value
   ✅ Change EMAIL_PASS to app-specific password
   ✅ Set NODE_ENV=production
   ✅ Enable HTTPS (SSL certificate)
   ✅ Configure CORS (if frontend on different domain)
   ✅ Rate limiting enabled
   ✅ CSRF protection enabled (if forms used)
   ✅ MongoDB whitelist only production IP
   ```

2. **Update .env for Production**
   ```bash
   NODE_ENV=production
   JWT_EXPIRY=7d
   LOCATION_UPDATE_INTERVAL=5000
   # Use production MongoDB URI
   # Use production email service
   ```

3. **Performance Optimization**
   ```bash
   # Enable compression
   npm install compression

   # Add to app.js
   const compression = require('compression');
   app.use(compression());
   ```

### Deploy to Heroku

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create app
heroku create your-app-name

# 4. Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your_secret_key"
heroku config:set EMAIL_HOST="smtp.gmail.com"
heroku config:set EMAIL_USER="your_email@gmail.com"
heroku config:set EMAIL_PASS="your_app_password"
heroku config:set NODE_ENV="production"

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs --tail
```

### Deploy to AWS

```bash
# 1. Create EC2 instance (Ubuntu 20.04)
# t2.micro (free tier)

# 2. Connect via SSH
ssh -i key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Clone repository
git clone your-repo-url
cd project

# 5. Install dependencies
npm install

# 6. Create .env file with production values
nano .env

# 7. Install PM2 (process manager)
npm install -g pm2

# 8. Start with PM2
pm2 start app.js --name "geotrack"
pm2 startup
pm2 save

# 9. Install Nginx (reverse proxy)
sudo apt-get install nginx

# 10. Configure Nginx (point to localhost:3000)
# Edit /etc/nginx/sites-available/default
sudo systemctl start nginx
```

---

## 📝 Notes for Development

### Common Development Tasks

#### Add New Location Field
1. Update `User.js` schema
2. Update locationController endpoints
3. Update frontend to send the new field
4. Broadcast via Socket.IO

#### Add New User Field
1. Update `User.js` schema
2. Update registration form (signup.ejs)
3. Update profile page (if exists)
4. Update API responses

#### Change Location Update Interval
```javascript
// In script.js, line 15
const LOCATION_UPDATE_INTERVAL = 10000; // Change from 5000 to 10000 for 10 seconds
```

#### Debug Location Updates
```javascript
// Open browser console (F12)
// Add to script.js temporarily
window.DEBUG = true;

// All location updates will log to console
// Look for "📍 Sending location..." messages
```

---

## 📞 Support & Troubleshooting

### Quick Checklist for Non-Working App

1. ✅ `.env` file exists with all required variables
2. ✅ MongoDB is running and accessible
3. ✅ Email credentials are correct
4. ✅ `npm install` completed without errors
5. ✅ `npm run dev` shows no startup errors
6. ✅ Browser can open `http://localhost:3000`
7. ✅ No errors in browser console (F12)
8. ✅ GPS permission granted to browser
9. ✅ Internet connection is stable
10. ✅ Server and MongoDB in same network (for local dev)

### Getting Help

1. **Check Terminal Logs**
   - Look for error messages starting with ❌
   - Check full error stack trace

2. **Check Browser Console**
   - Open F12 → Console tab
   - Look for JavaScript errors (red text)

3. **Check Network Tab**
   - Open F12 → Network tab
   - Send OTP and watch requests
   - Look for failed requests (red text)

4. **Common Error Messages**
   - `Cannot find module 'X'` → Run `npm install`
   - `ECONNREFUSED` → MongoDB not running
   - `Invalid login credentials` → Check email/password
   - `Unexpected token` → Check .env syntax

---

## ✅ Verification Checklist

After setup, verify each feature works:

- [ ] Can open http://localhost:3000
- [ ] Can sign up with email OTP
- [ ] Can log in with email and password
- [ ] GPS permission request appears
- [ ] Map shows with your location marker (green)
- [ ] Location updates every 5 seconds
- [ ] Other logged-in user's location shows (blue marker)
- [ ] Can toggle location sharing on/off
- [ ] Sidebar shows active users list
- [ ] Can click user name to center map on them
- [ ] Status indicators show online/stale/offline
- [ ] Friend requests can be sent
- [ ] Friend requests can be accepted/rejected
- [ ] Can view friend's location after accepting

---

## 📚 Additional Resources

- **Leaflet.js Docs**: https://leafletjs.com/reference
- **Socket.IO Docs**: https://socket.io/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Express.js Docs**: https://expressjs.com
- **Node.js Docs**: https://nodejs.org/docs

---

**Last Updated**: May 2026 | **Version**: 2.0 | **Status**: ✅ Production Ready
