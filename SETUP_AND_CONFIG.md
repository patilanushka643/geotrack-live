# ⚙️ Setup & Configuration Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env` file in project root:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/geotrack
# or use MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/geotrack

# JWT Secret (change in production!)
JWT_SECRET=your_super_secret_key_change_this_in_production

# Email Configuration (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Server Port
PORT=3000
NODE_ENV=development
```

### 3. Google Maps API Setup

#### Get Your API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable these APIs:
   - Google Maps JavaScript API
   - Google Maps Embed API
   - Places API (optional)

4. Create API Key:
   - Go to "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

5. Add to `home.ejs`:

```html
<!-- Line 5 in home.ejs -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

#### API Key Restrictions (Recommended):

1. In Google Cloud Console, select your API key
2. Click "Application restrictions"
3. Select "HTTP referrers (web sites)"
4. Add:
   ```
   http://localhost:3000/*
   http://localhost:3000
   ```

5. Click "API restrictions"
6. Select "Restrict key" and choose:
   - Google Maps JavaScript API
   - Google Maps Embed API

### 4. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Windows
mongod

# macOS/Linux
brew services start mongodb-community
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account and cluster
3. Get connection string
4. Add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/geotrack
```

#### Verify Connection:
```bash
mongo
# or
mongosh  # for newer versions
```

### 5. Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

---

## 📁 Project Structure

```
p/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── locationController.js # Location logic (UPDATED)
│   └── friendController.js   # Friend logic
├── models/
│   ├── User.js              # User schema
│   ├── Friendship.js        # Friend relationships
│   └── LocationHistory.js   # Location history
├── middleware/
│   └── authMiddleware.js    # Auth verification
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── locationRoutes.js    # Location endpoints
│   └── friendRoutes.js      # Friend endpoints
├── utils/
│   ├── email.js             # Email service
│   └── otp.js               # OTP utilities
├── public/
│   ├── css/
│   │   └── style.css        # Styles
│   └── js/
│       └── script.js        # Static scripts (if any)
├── views/
│   ├── home.ejs             # Main dashboard (UPDATED)
│   ├── login.ejs            # Login page
│   ├── signup.ejs           # Signup page
│   ├── forgot-password.ejs  # Password reset
│   └── ...                  # Other pages
├── app.js                   # Express app (UPDATED)
├── package.json             # Dependencies
├── .env                     # Environment config
└── LOCATION_INTEGRATION_GUIDE.md  # NEW: Full guide
```

---

## 🔧 Configuration Details

### Email Setup for OTP

#### Using Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate "App Password":
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Security → App Passwords
   - Select "Mail" and "Windows Computer"
   - Copy the password

3. Add to `.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

#### Using Other Email Providers:
Update `EMAIL_HOST` and `EMAIL_PORT` accordingly:
- Outlook: smtp-mail.outlook.com:587
- Yahoo: smtp.mail.yahoo.com:587
- SendGrid: smtp.sendgrid.net:587

### JWT Configuration

The JWT secret is used to sign authentication tokens. Change it in production:

```env
JWT_SECRET=generate_random_string_at_least_32_chars_long
```

To generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,                    // Unique, lowercase, trimmed
  fullName: String,                 // User's display name
  userId: String,                   // Unique username
  passwordHash: String,             // Hashed password
  
  // OTP verification
  otp: String,                      // Hashed OTP
  otpExpiry: Date,                  // OTP expiration time
  otpAttempts: Number,              // Failed attempts counter
  otpLastSentAt: Date,              // Last OTP send time
  isVerified: Boolean,              // Email verification status
  
  // Password reset
  passwordResetOtp: String,         // Hashed reset OTP
  passwordResetOtpExpiry: Date,
  passwordResetOtpAttempts: Number,
  passwordResetOtpLastSentAt: Date,
  isPasswordResetVerified: Boolean,
  
  // Location tracking
  latitude: Number,                 // Current latitude
  longitude: Number,                // Current longitude
  locationLastUpdated: Date,        // Last update timestamp
  isLocationSharing: Boolean,       // Sharing enabled?
  
  // Friends list
  friendList: [ObjectId],           // Array of friend user IDs
  
  createdAt: Date,
  updatedAt: Date
}
```

### LocationHistory Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // Reference to User
  latitude: Number,
  longitude: Number,
  accuracy: Number,                 // GPS accuracy in meters
  createdAt: Date                   // Auto-created timestamp
}
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Change `EMAIL_USER` and `EMAIL_PASS`
- [ ] Enable HTTPS (use production URL)
- [ ] Set `NODE_ENV=production`
- [ ] Restrict Google Maps API key to your domain
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Set strong cookie options (HttpOnly, Secure, SameSite)
- [ ] Enable CORS restrictions if needed
- [ ] Add rate limiting to API endpoints
- [ ] Add input validation on all endpoints
- [ ] Use helmet.js for security headers
- [ ] Enable HTTPS/SSL certificate

---

## 🧪 Testing Setup

### Create Test Users

Use the testing guide in `LOCATION_INTEGRATION_GUIDE.md`:

```bash
# User 1
Email: alice@test.com
Username: alice_123
Password: password123

# User 2
Email: bob@test.com
Username: bob_456
Password: password123

# User 3
Email: charlie@test.com
Username: charlie_789
Password: password123
```

### Test Endpoints

Use Postman or curl to test API:

```bash
# Get location update endpoint
curl -X POST http://localhost:3000/api/location/update \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -d '{"latitude": 37.7749, "longitude": -122.4194, "accuracy": 25}'

# Get users list
curl -X GET http://localhost:3000/api/location/users \
  -H "Cookie: authToken=YOUR_TOKEN"

# Get specific user location
curl -X GET http://localhost:3000/api/location/user/USER_ID \
  -H "Cookie: authToken=YOUR_TOKEN"
```

---

## 📊 Database Inspection

### Using MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to your MongoDB instance
3. Browse collections: `users`, `locationhistories`
4. View location data for each user

### Using MongoDB Shell

```bash
# Connect
mongo

# Select database
use geotrack

# View users
db.users.find().pretty()

# View specific user
db.users.findOne({email: "alice@test.com"})

# View location history
db.locationhistories.find({userId: ObjectId("...")}).pretty()

# Check online users (updated in last 60 seconds)
db.users.find({
  locationLastUpdated: {
    $gte: new Date(Date.now() - 60000)
  }
}).pretty()
```

---

## 🚨 Troubleshooting

### Issue: "Cannot find module 'dotenv'"

**Solution**:
```bash
npm install dotenv
```

### Issue: "MongoDB connection failed"

**Check**:
1. MongoDB service is running: `mongo --version`
2. Connection string in `.env` is correct
3. Database name exists in MongoDB
4. No firewall blocking connection

### Issue: "Google Maps not loading"

**Check**:
1. API key is correct in `home.ejs`
2. Google Maps JavaScript API is enabled
3. API key has no restrictions blocking localhost
4. Check browser console for errors

### Issue: "OTP not received"

**Check**:
1. Email configuration in `.env` is correct
2. Gmail app password is used (not regular password)
3. Check console for OTP: `🔐 OTP for email: XXXXXX`
4. Check spam/junk folder

### Issue: "Location not updating"

**Check**:
1. Browser geolocation permission is granted
2. Check browser console for errors
3. Verify `POST /api/location/update` is being called
4. Check MongoDB: `db.users.findOne({email: "..."}, {latitude: 1, longitude: 1})`

### Issue: "Friends list shows 0 users"

**Check**:
1. At least 2 users are registered
2. Both users are verified (`isVerified: true`)
3. Users are not the same person
4. Check `GET /api/location/users` response

---

## 📈 Performance Optimization

### 1. Location Update Frequency

In `home.ejs`, adjust the interval:

```javascript
// Current: 5 seconds
locationUpdateInterval = setInterval(() => {
  if (locationSharingEnabled) {
    getAndShareLocation();
  }
}, 5000);  // Change 5000 to your desired milliseconds
```

Recommendations:
- 5000ms (5s): Most accurate, higher battery/network usage
- 10000ms (10s): Good balance
- 30000ms (30s): Conservative, lower battery usage

### 2. Index Creation for MongoDB

For faster queries, create indexes:

```bash
# Run in MongoDB shell
use geotrack

# Index for email lookups
db.users.createIndex({email: 1})

# Index for userId lookups
db.users.createIndex({userId: 1}, {unique: true, sparse: true})

# Index for location history
db.locationhistories.createIndex({userId: 1})
db.locationhistories.createIndex({createdAt: -1})

# Index for verification status
db.users.createIndex({isVerified: 1})
```

### 3. Cache User List

The users list is fetched every time. Consider:
- Caching in frontend for 30-60 seconds
- Using WebSockets to push updates
- Pagination for large user bases

---

## 📱 Mobile Support

The app is responsive but for production mobile apps:

1. **Native Android/iOS App**:
   - Use native geolocation APIs
   - Same backend endpoints
   - Better battery optimization

2. **React Native**:
   ```bash
   npm install react-native-geolocation-service
   ```

3. **Flutter**:
   ```yaml
   dependencies:
     geolocator: ^9.0.0
     google_maps_flutter: ^2.0.0
   ```

---

## 🔄 Deployment

### Heroku Deployment

1. Create Heroku account
2. Install Heroku CLI
3. Create `Procfile`:
   ```
   web: node app.js
   ```

4. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set JWT_SECRET=your_secret
   heroku config:set MONGODB_URI=your_mongodb_uri
   git push heroku main
   ```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

Build and run:
```bash
docker build -t geotrack .
docker run -p 3000:3000 --env-file .env geotrack
```

---

## 📚 Additional Resources

- [Google Maps API Docs](https://developers.google.com/maps/documentation/javascript)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/)
- [Socket.io Documentation](https://socket.io/docs/)

---

## 💡 Next Steps

1. **Test the implementation** using the testing guide
2. **Monitor console logs** for debugging
3. **Verify database** has location data
4. **Test with multiple users** to ensure real-time updates
5. **Deploy to production** with security checklist
6. **Add friend list functionality** (optional enhancement)
7. **Implement location history** charts and analytics

---

## 📞 Support

For issues:
1. Check the **Troubleshooting** section above
2. Review **LOCATION_INTEGRATION_GUIDE.md**
3. Check browser console (DevTools)
4. Check server logs for errors
5. Verify `.env` configuration
6. Check MongoDB connection
