# ⚡ Quick Reference Card

## 🚀 Quick Start (5 minutes)

### 1. Install & Setup
```bash
npm install
```

### 2. Configure `.env`
```env
MONGODB_URI=mongodb://localhost:27017/geotrack
JWT_SECRET=your_secret_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

### 3. Add Google Maps API Key
Edit `views/home.ejs`, line 5:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

### 4. Start Server
```bash
npm start
```

Server runs at: `http://localhost:3000`

---

## 🧪 Quick Test (10 minutes)

### Create 2 Users

**User 1: Alice**
```
Email: alice@test.com
OTP: Check console
Full Name: Alice Johnson
User ID: alice_123
Password: password123
```

**User 2: Bob**
```
Email: bob@test.com
OTP: Check console
Full Name: Bob Smith
User ID: bob_456
Password: password123
```

### Test the Feature

1. **Login as Alice** → `/home`
2. **Allow geolocation** (browser prompt)
3. **Wait 5 seconds** for location update
4. **Open another tab/incognito** → Login as Bob
5. **Bob also allows geolocation**
6. **Back to Alice's tab** → Click "Bob Smith" in sidebar
7. ✅ **Map shows Bob's location with marker**

---

## 📱 Console Logs to Look For

```
🚀 Initializing GeoTrack...          ← App starting
📍 Starting location tracking...     ← Geolocation enabled
✅ Got current position: ...         ← Your location found
✅ Location sent to server          ← Saved to database
📋 Loading users list...            ← Fetching friends
✅ Users loaded: 2                  ← Found 2 friends
👤 Bob Smith: 🟢 Online            ← Friend online
👤 Selected user: {userId: ...}    ← User clicked
📡 Fetching location from: ...      ← API request sent
📥 API Response: {success: true}    ← Got location data
🗺️ Viewing location on map:        ← Displaying on map
📍 Moving map to: {lat: ..., lng: ...} ← Map centered
➕ Creating new marker              ← Marker added
```

---

## 🐛 Debugging Checklist

| Check | How |
|-------|-----|
| Server running? | `http://localhost:3000` loads |
| MongoDB connected? | Console shows: `✅ MongoDB connected` |
| Google Maps loaded? | Map visible, no errors in DevTools Console |
| Location updating? | Console shows "Location sent to server" every 5 sec |
| User location saved? | Check in MongoDB: `db.users.findOne({email: "alice@test.com"}, {latitude: 1, longitude: 1})` |
| Friend location fetching? | Network tab shows `GET /api/location/user/{id}` with 200 status |

---

## 📊 API Endpoint Quick Test

### Get All Users (with locations)
```bash
curl -X GET http://localhost:3000/api/location/users \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### Get Specific User Location
```bash
curl -X GET http://localhost:3000/api/location/user/USER_ID \
  -H "Cookie: authToken=YOUR_TOKEN"
```

### Update Your Location (Manual Test)
```bash
curl -X POST http://localhost:3000/api/location/update \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=YOUR_TOKEN" \
  -d '{"latitude": 37.7749, "longitude": -122.4194, "accuracy": 25}'
```

---

## 🗺️ Google Maps Features

| Feature | What It Does |
|---------|-------------|
| **Click Friend Name** | Fetches location from database, centers map, adds marker |
| **Click Marker** | Opens info window with name, email, coordinates, time |
| **Zoom Controls** | Top-right: `+` and `-` buttons |
| **Fullscreen** | Top-right: square icon |
| **Map Type** | Top-right: layer icon (satellite, terrain, etc.) |
| **Street View** | Click pegman, drag to street |
| **Pan** | Drag the map to move |

---

## 📝 Common Commands

```bash
# Start server
npm start

# Start with auto-reload
npm run dev

# Check MongoDB
mongo
use geotrack
db.users.find().pretty()

# Check running processes
lsof -i :3000

# Kill process on port 3000
kill -9 $(lsof -t -i:3000)
```

---

## 🔑 Important Files

| File | Purpose | Status |
|------|---------|--------|
| `controllers/locationController.js` | Location API logic | ✅ Updated |
| `views/home.ejs` | Main dashboard | ✅ Updated |
| `models/User.js` | User schema | ✅ Has location fields |
| `.env` | Configuration | ⚠️ Needs setup |
| `LOCATION_INTEGRATION_GUIDE.md` | Full testing guide | ✅ Created |
| `SETUP_AND_CONFIG.md` | Setup instructions | ✅ Created |
| `TECHNICAL_SUMMARY.md` | Technical details | ✅ Created |

---

## ✅ Success Indicators

- [ ] App loads at `http://localhost:3000`
- [ ] Can register 2 users with email OTP
- [ ] Can login and see friends list
- [ ] Map displays in main area
- [ ] Clicking friend shows their location on map
- [ ] Info window shows friend details
- [ ] Console shows emoji-prefixed logs
- [ ] No "Unable to access location" errors
- [ ] Multiple users appear as markers on map

---

## 🚨 If Something Breaks

### Error: "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### Error: "MongoDB connection failed"
- Check `.env` MONGODB_URI
- Ensure MongoDB service is running
- Try: `mongo --version`

### Error: "Google Maps not loading"
- Check API key in home.ejs line 5
- Verify Maps JavaScript API enabled
- Check DevTools Console for errors

### Error: "OTP not received"
- Check `.env` email configuration
- Look for OTP in console: `🔐 OTP for email: XXXXXX`
- Check spam folder

### Error: "Friend location shows nothing"
- Ensure friend has allowed geolocation
- Wait 5 seconds for location update
- Check MongoDB: does user have lat/lng?
- Check `isLocationSharing` is true

---

## 📞 Need More Help?

1. **Full Testing Guide**: Read `LOCATION_INTEGRATION_GUIDE.md`
2. **Setup Instructions**: Read `SETUP_AND_CONFIG.md`
3. **Technical Details**: Read `TECHNICAL_SUMMARY.md`
4. **Check Logs**: Look for emoji-prefixed console messages
5. **Monitor Network**: DevTools Network tab → filter by location
6. **Check Database**: Use MongoDB Compass or shell commands

---

## 🎯 Architecture Overview

```
User Clicks Friend
    ↓
Frontend: GET /api/location/user/{friendId}
    ↓
Backend: Query MongoDB
    ↓
Return friend's location (lat, lng, email, name, etc.)
    ↓
Frontend: Create marker on Google Maps
    ↓
Display info window on click
    ↓
✅ Success!
```

---

## 📈 Performance Notes

- Location update frequency: **5 seconds** (adjustable in `home.ejs`)
- Online status window: **60 seconds** (if no update, marked offline)
- API response time: **~50ms** (typical database query)
- Browser storage: Uses cookies for JWT token

---

## 🔒 Security Reminders

- ✅ All endpoints require authentication
- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens expire in 7 days
- ⚠️ Change `JWT_SECRET` in production
- ⚠️ Use HTTPS in production
- ⚠️ Restrict Google Maps API key to your domain

---

## 📱 Test on Mobile

The app is responsive. Test on mobile by:

1. Open `http://localhost:3000` on phone
2. Allow geolocation permission
3. Same features work on mobile
4. Map is touch-friendly
5. Sidebar collapses on small screens

---

## 🎓 Learning Resources

- [Google Maps API](https://developers.google.com/maps/documentation/javascript)
- [Socket.io Guide](https://socket.io/docs/)
- [JWT Explained](https://jwt.io/introduction)
- [MongoDB Basics](https://docs.mongodb.com/manual/introduction/)
- [Express.js](https://expressjs.com/)
