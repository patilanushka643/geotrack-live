# 🚀 QUICK START GUIDE - GeoTrack

**Get your real-time location tracking app running in 10 minutes!**

---

## ⚡ Super Quick Start (5 minutes)

### 1. Clone/Open Project
```bash
cd /path/to/project
ls app.js  # Verify files exist
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create .env File
Copy this into a new `.env` file:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/geotrack
JWT_SECRET=thisisatestkeymin32characterslong1234567890
JWT_EXPIRY=7d
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
LOCATION_UPDATE_INTERVAL=5000
GPS_ACCURACY_REQUIREMENT=high
ONLINE_THRESHOLD_SECONDS=60
STALE_THRESHOLD_MINUTES=5
```

### 4. Start MongoDB
**Option A: Local MongoDB**
```bash
# In a separate terminal
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create free cluster
- Get connection string
- Replace in .env: `mongodb+srv://user:pass@cluster.mongodb.net/geotrack`

### 5. Start Server
```bash
npm run dev
```

**Expected output:**
```
🚀 Location Sharing System Initialized
✅ Database connected
🚀 Server running on http://localhost:3000
```

### 6. Open Browser
```
http://localhost:3000
```

### 7. Create Account
- Click "Sign Up"
- Enter email
- Click "Send OTP"
- Check email for code
- Enter code and create account
- Grant GPS permission

### ✅ Done! Map should show your location.

---

## 🔧 Setup by Email Service

### Option 1: Gmail (Recommended)
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Windows Computer"
3. Copy 16-char password
4. Add to .env:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_password
```

### Option 2: Mailtrap (Easiest for Testing)
1. Go to [mailtrap.io](https://mailtrap.io) → Sign up
2. Create Testing Inbox
3. Go to Integrations → Nodemailer
4. Copy credentials
5. Add to .env:
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
```

---

## 🐛 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Start MongoDB: `mongod` |
| `Cannot find module` | Run: `npm install` |
| `OTP not received` | Check spam folder / check email credentials |
| `GPS not working` | Click lock icon in address bar → Allow location |
| `Location not updating` | Refresh page, check browser console (F12) |

---

## 📋 Testing Multi-User Setup

### Test with Multiple Users

1. **Open 2 Browser Windows**
   - Window 1: `http://localhost:3000`
   - Window 2: Same URL (or different browser)

2. **Sign Up Different Users**
   - User 1: Email `user1@example.com`
   - User 2: Email `user2@example.com`

3. **Grant GPS Permission**
   - Both windows should have location permission

4. **View Both Locations**
   - In Window 1: Should see blue marker for User 2
   - In Window 2: Should see blue marker for User 1
   - Updates every 5 seconds

5. **Test Features**
   - Click username in sidebar → Map centers on them
   - Toggle sharing switch → Location stops updating
   - Open DevTools (F12) → Console → See real-time updates

---

## 🎯 Features to Test

- [x] Sign up with email OTP
- [x] Login with email/password
- [x] GPS location tracking (green marker)
- [x] View other users (blue markers)
- [x] Real-time location updates
- [x] Toggle location sharing
- [x] Click user to center map
- [x] Status indicators (online/offline)
- [x] Add friends (optional)

---

## 📱 Test on Mobile

1. **Start Server** (on your computer)
2. **Find Your IP Address**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig | findstr "IPv4"
   ```
   Example: `192.168.1.100`

3. **Open on Mobile Browser**
   ```
   http://192.168.1.100:3000
   ```

4. **Grant GPS Permission**
   - Tap "Allow" when browser asks

5. **Test Location Tracking**
   - Walk around with phone
   - Location updates on map every 5 seconds

---

## 🔌 Socket.IO Real-Time Updates

Watch real-time events in browser console:

```javascript
// Open browser console (F12 → Console)

// See all received locations
// Look for "receive-location" messages

// Check Socket.IO status
console.log(socket.connected);  // Should be true

// Force a location update
socket.emit("send-location", {
  userId: "your_user_id",
  username: "your_username",
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 5
});
```

---

## 📊 API Testing with cURL

### Test Location Update
```bash
# 1. Get JWT token from login response
# 2. Send location
curl -X POST http://localhost:3000/api/location/update \
  -H "Cookie: authToken=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 5
  }'
```

### Get All Users
```bash
curl -X GET http://localhost:3000/api/location/users \
  -H "Cookie: authToken=YOUR_JWT_TOKEN"
```

### Get Active Users Only
```bash
curl -X GET http://localhost:3000/api/location/active \
  -H "Cookie: authToken=YOUR_JWT_TOKEN"
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use production `MONGODB_URI`
- [ ] Configure SSL/HTTPS
- [ ] Update `EMAIL_PASS` to app-specific password
- [ ] Test OTP emails
- [ ] Test location tracking
- [ ] Test with multiple users
- [ ] Check browser console for errors (F12)
- [ ] Monitor server logs for errors

---

## 📚 Next Steps

### Add More Features
- [ ] Marker clustering for many users
- [ ] Route history tracking
- [ ] Speed/direction indicators
- [ ] Geofencing/boundaries
- [ ] Location sharing groups
- [ ] Mobile app (React Native)

### Improve Performance
- [ ] Redis caching for user list
- [ ] Database indexing on location
- [ ] Reduce Socket.IO message size
- [ ] Implement marker clustering

### Enhance Security
- [ ] Rate limiting on location updates
- [ ] Encryption for location data
- [ ] GDPR compliance
- [ ] Data retention policies

---

## 📞 Need Help?

1. **Check Terminal Output**
   - Look for ❌ error messages
   - Read full error stack

2. **Open Browser Console (F12)**
   - Look for red error messages
   - Check Network tab

3. **Check Server Logs**
   - Watch terminal running `npm run dev`
   - Look for Socket.IO connection messages

4. **Common Issues**
   - No location updates? → Check GPS permission
   - Users not seeing each other? → Check Socket.IO connected
   - OTP not working? → Check email credentials
   - Database errors? → Check MongoDB running

---

## ✅ Success Indicators

When app is working correctly:

1. ✅ Browser shows map with your location (green marker)
2. ✅ Other users' locations show as blue markers
3. ✅ Your location updates every 5 seconds (watch it change)
4. ✅ Sidebar shows list of active users
5. ✅ Clicking a user centers map on their location
6. ✅ Browser console shows real-time Socket.IO events
7. ✅ Status badges show online/offline status
8. ✅ Can toggle location sharing on/off

---

## 🎓 Learning Path

1. **Understand the Architecture**
   - Read [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)
   - Review system architecture diagram

2. **Explore the Code**
   - Check [app.js](app.js) for Socket.IO setup
   - Review [controllers/locationController.js](controllers/locationController.js)
   - Examine [public/js/script.js](public/js/script.js) for frontend logic

3. **Test Features**
   - Create multiple accounts
   - Test on different devices
   - Monitor real-time updates

4. **Deploy to Production**
   - Follow [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) → Production Deployment
   - Use Heroku, AWS, or DigitalOcean

---

**Version**: 2.0 | **Status**: ✅ Production Ready | **Last Updated**: May 2026
