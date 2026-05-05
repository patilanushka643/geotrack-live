# Environment Configuration Template

This file shows all available environment variables and their default values.

## Quick Start (.env file)

Copy this entire content to a `.env` file in the project root directory.

```env
# ============================================
# 🌍 GEOTRACK - ENVIRONMENT CONFIGURATION
# ============================================
# 
# Copy this file to .env in project root
# Replace all placeholder values (YOUR_...) with actual values
#

# ============================================
# SERVER CONFIGURATION
# ============================================

# Port number for the server
PORT=3000

# Environment mode: development, production, testing
NODE_ENV=development

# ============================================
# DATABASE CONFIGURATION (MongoDB)
# ============================================

# MongoDB Connection String
# Format: mongodb+srv://username:password@cluster.mongodb.net/database
# 
# Example for MongoDB Atlas:
# mongodb+srv://myuser:mypassword@cluster0.mongodb.net/geotrack?retryWrites=true&w=majority
#
# Example for Local MongoDB:
# mongodb://localhost:27017/geotrack
#
MONGODB_URI=mongodb+srv://YOUR_MONGODB_USERNAME:YOUR_MONGODB_PASSWORD@YOUR_CLUSTER.mongodb.net/geotrack?retryWrites=true&w=majority

# MongoDB connection timeout in milliseconds
MONGODB_TIMEOUT_MS=5000

# ============================================
# AUTHENTICATION (JWT)
# ============================================

# JWT Secret Key (min 32 characters for security)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_key_min_32_characters_long_here_12345

# JWT Token Expiry Time
JWT_EXPIRY=7d

# ============================================
# EMAIL CONFIGURATION
# ============================================

# Email Service Host (SMTP)
# Examples: smtp.gmail.com, smtp.mailtrap.io, smtp.sendgrid.net
EMAIL_HOST=smtp.gmail.com

# Email Service Port (usually 587 for TLS, 465 for SSL)
EMAIL_PORT=587

# Email Account Username/Address
EMAIL_USER=your_email@gmail.com

# Email Account Password or App-Specific Password
# For Gmail: Use 16-character App Password (not your Gmail password!)
# To generate: https://myaccount.google.com/apppasswords
EMAIL_PASS=your_16_char_app_password

# Email From Address (shown to users)
# Can be same as EMAIL_USER
EMAIL_FROM=noreply@geotrack.com

# ============================================
# OTP CONFIGURATION
# ============================================

# OTP Expiry Time in Minutes
OTP_EXPIRY_MINUTES=5

# Maximum OTP Verification Attempts
OTP_MAX_ATTEMPTS=5

# ============================================
# LOCATION TRACKING CONFIGURATION
# ============================================

# Location Update Interval in Milliseconds
# How often browser sends location to server
# Recommended: 5000 (5 seconds)
# Minimum: 1000 (1 second) - for testing
# Maximum: 30000 (30 seconds) - for slow connections
LOCATION_UPDATE_INTERVAL=5000

# GPS Accuracy Level
# Options: high, best, balanced, low_power
GPS_ACCURACY_REQUIREMENT=high

# Online Threshold in Seconds
# User is considered "online" if location updated within this time
# Recommended: 60 (1 minute)
ONLINE_THRESHOLD_SECONDS=60

# Stale Threshold in Minutes
# Location is considered "stale" if older than this
# Recommended: 5 (5 minutes)
STALE_THRESHOLD_MINUTES=5

# ============================================
# RATE LIMITING (Optional)
# ============================================

# Rate Limit: Max requests per window
RATE_LIMIT_REQUESTS=100

# Rate Limit: Time window in milliseconds
RATE_LIMIT_WINDOW=900000

# ============================================
# CORS CONFIGURATION (Optional)
# ============================================

# Allow requests from this origin
# Examples: http://localhost:3000, https://yourdomain.com, *
CORS_ORIGIN=http://localhost:3000

# ============================================
# SESSION CONFIGURATION (Optional)
# ============================================

# Session Secret for session management
SESSION_SECRET=your_session_secret_key_here_min_32_chars

# ============================================
# LOGGING CONFIGURATION (Optional)
# ============================================

# Log Level: debug, info, warn, error
LOG_LEVEL=info

# ============================================
```

## Configuration by Service

### MongoDB Atlas Setup

```env
# 1. Go to mongodb.com/cloud/atlas
# 2. Create account and free cluster
# 3. Create user (Database Users section)
# 4. Get connection string (Click "Connect" → "Drivers" → "Node.js")
# 5. Copy and paste below, replace:
#    - <password> with user password
#    - myFirstDatabase with "geotrack"

MONGODB_URI=mongodb+srv://user:password@cluster0.mongodb.net/geotrack?retryWrites=true&w=majority
```

### MongoDB Local Setup

```env
# 1. Install MongoDB Community Edition locally
# 2. Start MongoDB: mongod
# 3. Use local connection string:

MONGODB_URI=mongodb://localhost:27017/geotrack
```

### Gmail Setup

```env
# 1. Enable 2-Factor Authentication on Google Account
#    Go to: https://myaccount.google.com/security
# 2. Create App Password (select Mail and Windows Computer)
#    Go to: https://myaccount.google.com/apppasswords
# 3. Use these settings:

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### Mailtrap Setup (Recommended for Testing)

```env
# 1. Go to mailtrap.io and create free account
# 2. Create Testing Inbox
# 3. Go to Integrations → Nodemailer
# 4. Copy credentials:

EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_username
EMAIL_PASS=your_mailtrap_password
```

### SendGrid Setup

```env
# 1. Go to sendgrid.com and create account
# 2. Create API Key
# 3. Use these settings:

EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.your_api_key_here
```

## Generating Required Values

### Generate JWT Secret

```bash
# One-liner to generate random 32-char secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a3f8c9e2d1b7f4a6c9e2d1b7f4a6c9e2d1b7f4a6c9e2d1b7f4a6c9e2d1b7f4a

# Copy entire output to JWT_SECRET in .env
```

### Generate Session Secret

```bash
# Same as JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Create MongoDB User

```bash
# In MongoDB Atlas:
# 1. Go to Database Access
# 2. Click "Add New User"
# 3. Enter username and password
# 4. Set role to "readWriteAnyDatabase"
# 5. Use these in connection string

MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/geotrack
```

## Validating .env File

### Check All Variables

```bash
# Verify .env exists
test -f .env && echo "✅ .env file exists" || echo "❌ .env file missing"

# Check specific variables
grep "MONGODB_URI" .env && echo "✅ MongoDB configured" || echo "❌ MongoDB not configured"
grep "JWT_SECRET" .env && echo "✅ JWT configured" || echo "❌ JWT not configured"
grep "EMAIL_USER" .env && echo "✅ Email configured" || echo "❌ Email not configured"
```

### Test MongoDB Connection

```bash
# Create test script
cat > test-db.js << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB connection successful');
  mongoose.disconnect();
})
.catch(err => {
  console.log('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
EOF

# Run test
node test-db.js

# Clean up
rm test-db.js
```

### Test Email Configuration

```bash
# Create test script
cat > test-email.js << 'EOF'
require('dotenv').config();
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
  if (err) {
    console.log('❌ Email verification failed:', err.message);
  } else {
    console.log('✅ Email configuration successful');
  }
  process.exit(0);
});
EOF

# Run test
node test-email.js

# Clean up
rm test-email.js
```

## Environment Variables by Deployment

### Development

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/geotrack
JWT_SECRET=local_dev_secret_key_here_32_chars_minimum
JWT_EXPIRY=7d
LOG_LEVEL=debug
```

### Staging

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/geotrack
JWT_SECRET=staging_random_secret_key_32_chars_minimum
JWT_EXPIRY=7d
LOG_LEVEL=info
```

### Production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/geotrack
JWT_SECRET=production_random_secret_key_32_chars_minimum_CHANGE_THIS
JWT_EXPIRY=7d
LOG_LEVEL=warn
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

## Security Best Practices

1. **Never commit .env to git**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use strong secrets**
   ```bash
   # Never use simple passwords
   # Always use minimum 32-character random strings
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Rotate secrets regularly**
   - Change JWT_SECRET monthly
   - Change database passwords seasonally
   - Update email app passwords annually

4. **Use environment-specific files**
   ```bash
   .env              # Development (local)
   .env.staging      # Staging
   .env.production   # Production
   ```

5. **Monitor secret exposure**
   - Check git history for accidentally committed secrets
   - Use tools like `git-secrets`
   - Use services like `truffleHog` to scan repositories

## Troubleshooting Configuration

### "Missing MONGODB_URI"
```bash
# Verify .env exists
ls -la .env

# Verify variable is set
grep "MONGODB_URI" .env

# If missing, add to .env file
```

### "Cannot read property 'something' of undefined"
```bash
# Verify all required variables are in .env
npm list --depth=0

# Restart server to reload .env
npm run dev
```

### "Email send failed"
```bash
# Test email configuration
node test-email.js (see script above)

# Check port: 587 for TLS, 465 for SSL
# Check credentials are correct
# Check email account allows app access (Gmail needs App Password)
```

## .env.example (for sharing)

Create `.env.example` to show team members what variables are needed:

```env
# .env.example - Copy to .env and fill in values

PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/geotrack
MONGODB_TIMEOUT_MS=5000

JWT_SECRET=your_32_character_random_secret_here
JWT_EXPIRY=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5

LOCATION_UPDATE_INTERVAL=5000
GPS_ACCURACY_REQUIREMENT=high
ONLINE_THRESHOLD_SECONDS=60
STALE_THRESHOLD_MINUTES=5
```

Then commit `.env.example` (without secrets) to git, but add `.env` to `.gitignore`.
