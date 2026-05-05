# 🐛 GeoTrack Troubleshooting & FAQ

---

## Quick Troubleshooting (5 min fix)

| Symptom | Quick Fix |
|---------|-----------|
| "Cannot find module" | `npm install` |
| "MongoDB connection refused" | Run `mongod` in terminal |
| "Port 3000 in use" | `killall node` then `npm run dev` |
| "OTP not received" | Check spam folder, verify email setup |
| "GPS not working" | Click lock icon → Allow location |
| "Map not showing" | F12 → Console → Check errors |
| "Location not updating" | Reload page, check GPS permission |
| "Users not seeing each other" | Check both logged in, open browser console |

---

## Database Issues

### ❌ "MongoDB connection refused"
**Symptoms:**
- Server won't start
- Error: `MongooseError: connect ECONNREFUSED 127.0.0.1:27017`

**Causes:**
1. MongoDB not running (local setup)
2. MongoDB Atlas connection string wrong
3. IP whitelist missing (Atlas)
4. Network connectivity issue

**Solutions:**

**For Local MongoDB:**
```bash
# Check if mongod is running
mongod --version  # Verify installation

# Start MongoDB
mongod  # Keep this terminal open

# Run in another terminal
npm run dev
```

**For MongoDB Atlas:**
```bash
# 1. Verify connection string format
# Should be: mongodb+srv://user:password@cluster.mongodb.net/geotrack

# 2. Check credentials
# Username and password case-sensitive
# Special chars in password must be URL encoded

# 3. Check whitelist
# Go to MongoDB Atlas → Network Access
# Add your IP or 0.0.0.0/0 (dev only)

# 4. Test connection
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(e => console.log('❌', e.message));
"
```

### ❌ "E11000 duplicate key error"
**Symptoms:**
- Cannot create new users
- Error mentions "unique index"
- "duplicate key error collection: geotrack.users index: email_1"

**Causes:**
- Old unique indexes conflicting with new schema
- User already exists in database

**Solutions:**
```bash
# 1. Delete entire database and start fresh (dev only)
# MongoDB Atlas: Go to Collections → Delete Database
# Local: Delete mongod data folder

# 2. Drop conflicting indexes
mongo geotrack
db.users.dropIndex("email_1")
db.users.dropIndex("userId_1")
exit

# 3. Restart server
npm run dev
```

### ❌ "Invalid JSON in response from auth request"
**Symptoms:**
- Signup/login fails silently
- Error: "JSON.parse(...)"
- Network shows 500 response

**Causes:**
- Server error (check terminal logs)
- Email service not configured
- Database query failed

**Solution:**
```bash
# 1. Check server terminal for error message
# Look for red text starting with ❌

# 2. Check .env file
grep EMAIL_HOST .env
grep MONGODB_URI .env

# 3. Restart server
npm run dev

# 4. Check browser console (F12)
# Look for red error messages
```

---

## Authentication Issues

### ❌ "OTP not received in email"
**Symptoms:**
- Click "Send OTP" but no email arrives
- Check spam folder → nothing

**Causes:**
1. Email credentials wrong
2. Gmail app password incorrect
3. SMTP host/port wrong
4. Email service down

**Solutions:**

**For Gmail:**
```bash
# 1. Verify 2FA enabled
# https://myaccount.google.com/security
# Enable "2-Step Verification"

# 2. Generate new app password
# https://myaccount.google.com/apppasswords
# Select: Mail → Windows Computer
# Copy 16-character password

# 3. Update .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password  # NOT your Gmail password!

# 4. Restart server
npm run dev

# 5. Try sending OTP again
```

**For Mailtrap:**
```bash
# 1. Sign up at mailtrap.io

# 2. Create Testing Inbox
# Click "Create Inbox"

# 3. Get credentials
# Click your inbox → Integrations → Nodemailer
# Copy host, port, user, password

# 4. Update .env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_user
EMAIL_PASS=your_pass

# 5. Restart server
npm run dev

# 6. Send OTP
# Sent emails show in Mailtrap inbox
# View in browser (great for testing!)
```

**Test Email Configuration:**
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
    console.log('❌ Email Error:', err.message);
  } else {
    console.log('✅ Email Connected');
  }
  
  // Send test email
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'test@example.com',
    subject: 'Test',
    text: 'Testing email'
  }, (err, info) => {
    if (err) console.log('❌ Send Error:', err);
    else console.log('✅ Email Sent');
    process.exit(0);
  });
});
EOF

# Run test
node test-email.js

# Clean up
rm test-email.js
```

### ❌ "Invalid OTP" error
**Symptoms:**
- Receive OTP in email
- Enter code → "Invalid OTP" error
- Code definitely correct

**Causes:**
1. OTP expired (>5 minutes)
2. Typo in code
3. Too many attempts (>5)
4. Code already used

**Solutions:**
```bash
# 1. Request new OTP
# Click "Send OTP" again (resets counter)

# 2. Check .env
# OTP_EXPIRY_MINUTES=5  (must be valid)

# 3. Check browser console
# F12 → Console → Look for error details

# 4. Wait 1 minute then try
# Allow server to process request fully

# 5. Clear browser cache
# F12 → Application → Clear Cache
# Reload page and try again
```

### ❌ "JWT verification failed"
**Symptoms:**
- Can't access /home after login
- Auto-redirected to /login
- Error in browser console

**Causes:**
1. JWT token expired
2. JWT_SECRET changed
3. Token corrupted/invalid
4. Browser cookies deleted

**Solutions:**
```bash
# 1. Clear cookies and login again
# F12 → Application → Cookies → Delete all
# Reload and login

# 2. Check JWT_SECRET
# Verify .env JWT_SECRET hasn't changed
# If changed: All old tokens invalid (normal)

# 3. Generate new JWT_SECRET
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Update .env and restart server

# 4. Check token expiry
# JWT_EXPIRY=7d in .env is standard
# After 7 days, login again
```

---

## GPS/Location Issues

### ❌ "GPS not supported"
**Symptoms:**
- Message: "GPS not supported"
- Location not updating
- No permission popup appears

**Causes:**
1. Old browser (doesn't support Geolocation API)
2. HTTPS not configured (security requirement)
3. HTTP only (works on localhost for testing)

**Solutions:**
```bash
# 1. Update browser
# Chrome, Firefox, Safari, Edge all support GPS
# Update to latest version

# 2. Use localhost for testing
# http://localhost:3000 works (exception)
# HTTPS required for production

# 3. Check browser support
# Can I Use: https://caniuse.com/geolocation
# Should show green checkmark for your browser
```

### ❌ "Permission denied" GPS error
**Symptoms:**
- Permission popup appears then disappears
- Error message: "Permission denied (error 1)"
- Location not updating even after allowing

**Causes:**
1. User denied permission
2. Browser security restrictions
3. Previous denial (browser remembers)

**Solutions:**
```bash
# 1. Reset permission
# Click lock icon in address bar
# Find "Location" → Set to "Allow"
# Reload page

# 2. Check browser settings
# Chrome: Settings → Privacy → Site Settings → Location
# Should show "Allowed" for localhost:3000

# 3. Disable "Block all" setting
# Some browsers have "Block all" option
# Disable this, set to "Ask"

# 4. Incognito mode
# Open in incognito/private window
# No previous denials, should ask fresh

# 5. Try different browser
# Firefox, Chrome, Safari
# Some handle GPS differently
```

### ❌ "Position unavailable" GPS error
**Symptoms:**
- Permission granted
- Still getting "Position unavailable"
- Can't get GPS signal

**Causes:**
1. GPS chip disabled on device
2. Weak GPS signal (indoors, underground)
3. Device doesn't support GPS (some tablets)

**Solutions:**
```
# 1. Go outdoors
# GPS needs clear sky view
# Indoors, underground, dense buildings block signal

# 2. Wait 30+ seconds
# GPS takes time to acquire lock
# First position slower than subsequent

# 3. Enable high accuracy
# Check .env: GPS_ACCURACY_REQUIREMENT=high
# Already enabled in code

# 4. Check device settings
# On mobile: Location must be ON
# Settings → Privacy → Location → Enable

# 5. Use simulation
# Chrome DevTools can simulate GPS
# F12 → ⋯ → More tools → Sensors
# Can set fake location for testing
```

### ❌ "Location accuracy poor"
**Symptoms:**
- Location updates, but way off
- Marker jumps around on map
- Says ±500m accuracy (very high)

**Causes:**
1. GPS signal weak
2. Tall buildings nearby
3. Dense forest/canopy
4. Testing on WiFi only (no GPS)

**Solutions:**
```bash
# 1. Go to open area
# Clear sky, away from buildings

# 2. Wait for GPS lock
# First few positions rough
# After 1 minute, should improve

# 3. Restart GPS
# Turn location off, wait 10 seconds, turn on

# 4. Check device
# Ensure location is enabled on phone
# Some devices have GPS on/off toggle

# 5. Disable battery saver
# Battery saver reduces GPS accuracy
# Disable if running tests
```

---

## Map/Frontend Issues

### ❌ "Map not loading"
**Symptoms:**
- Page loads but no map visible
- Gray area where map should be
- No error message visible

**Causes:**
1. Leaflet.js CDN not loading
2. Map element not in HTML
3. Map initialization failed
4. Browser console has errors

**Solutions:**
```bash
# 1. Check browser console (F12)
# Look for red error messages
# Most likely: Leaflet not loaded

# 2. Check internet connection
# Leaflet loaded from CDN
# Offline = no map

# 3. Check page HTML
# views/home.ejs should have:
# <div id="map"></div>
# Plus Leaflet CSS/JS includes

# 4. Check browser console manually
# F12 → Console tab
# Type: typeof L
# Should show "object" (Leaflet loaded)

# 5. Check network tab
# F12 → Network → Filter "XHR"
# Reload page
# Should see successful requests to:
#   - leaflet.min.js
#   - leaflet.min.css
#   - tile.openstreetmap.org (tiles)

# If seeing red X on any:
# - CDN down (rare)
# - Offline (no internet)
# - Blocked by ISP/firewall
```

### ❌ "Map showing, but no markers"
**Symptoms:**
- Map loads and centers
- But no user markers visible
- No error in console

**Causes:**
1. No users have sent locations
2. Socket.IO not connected
3. JavaScript error in frontend
4. User location data missing

**Solutions:**
```bash
# 1. Check Socket.IO connection
# Browser console (F12):
console.log(socket.connected);  // Should be true

# If false:
# - Server not running
# - Network issue
# - Socket.IO module error

# 2. Check if location was sent
# Browser console:
console.log(window.currentUserLocation);  // Should have lat/lng

# If undefined:
# - GPS permission not granted
# - GPS unavailable
# - No position yet (wait 5+ seconds)

# 3. Check network requests
# F12 → Network tab → Filter "location"
# Should see POST /api/location/update calls every 5 seconds

# If not seeing:
# - Location not being sent
# - API endpoint error
# - Check server logs

# 4. Check received location event
# F12 → Console type:
socket.on('receive-location', (data) => console.log('Location:', data));

# Then wait 5 seconds for location update
# Should log location data

# 5. Check database has location
# Connect to MongoDB and check:
# db.users.find({ locationLastUpdated: { $exists: true } })
# Should show users with locations
```

### ❌ "Markers not updating in real-time"
**Symptoms:**
- Markers appear initially
- Don't move when location updates
- No smooth animation

**Causes:**
1. Socket.IO events not received
2. Marker update code failing
3. Location not being sent
4. Browser tab not focused (some optimization)

**Solutions:**
```bash
# 1. Monitor Socket.IO events
# Browser console:
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});

# Now move around/update location
# Should see "receive-location" events every 5 seconds

# If not seeing:
# - Socket not connected (check socket.connected)
# - Server not broadcasting (check server logs)
# - Location not being sent from another user

# 2. Check browser focus
# Some browsers pause animations when tab not active
# Click on tab with map → should resume

# 3. Check for JavaScript errors
# F12 → Console → Red errors?
# Look for errors in script.js

# 4. Check location is being sent
# Send test location:
socket.emit('send-location', {
  userId: 'test123',
  username: 'testuser',
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 5
});

# Should appear on map in other users' browsers
```

---

## Server/Performance Issues

### ❌ "Server crashes randomly"
**Symptoms:**
- Server running fine, then stops
- Error in terminal then exits
- Terminal shows error stack trace

**Causes:**
1. Unhandled error/exception
2. Database connection lost
3. Memory leak
4. Port already in use

**Solutions:**
```bash
# 1. Check error message
# Read the error in terminal carefully
# Look for: at Function/Line numbers

# 2. Restart server
npm run dev

# 3. Use PM2 for auto-restart (production)
npm install -g pm2
pm2 start app.js --watch --name geotrack

# 4. Check memory usage
# If increasing over time (leak):
# - Check for setInterval without clearInterval
# - Check Socket.IO listeners cleaned up
# - Restart server periodically

# 5. Check database connection
# Terminal should show:
# ✅ Database connected
# If not: MongoDB not running

# 6. Check port conflicts
# Port 3000 already in use?
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# If in use:
killall node  # Mac/Linux
taskkill /PID {PID} /F  # Windows
```

### ❌ "Server slow/high latency"
**Symptoms:**
- Socket.IO updates take >1 second
- API responses slow
- CPU usage high

**Causes:**
1. Too many concurrent users
2. Database queries slow
3. Network latency
4. Server resource exhausted

**Solutions:**
```bash
# 1. Monitor server resources
# Check CPU/Memory in system monitor
# If >90% memory: Close other apps, restart server

# 2. Check database performance
# Long queries slow everything down
# Make sure MongoDB is local or fast connection

# 3. Check network latency
# Open DevTools → Network tab
# Check "Time" column for API calls
# Should be <200ms typical

# If seeing >500ms:
# - Slow internet connection
# - Database too far away (use regional servers)

# 4. Reduce location update frequency
# .env: LOCATION_UPDATE_INTERVAL=10000
# Change from 5000 to 10000 (10 seconds instead of 5)

# 5. Implement Redis caching
# For production with 1000+ users
# Reduces database queries significantly
```

### ❌ "High memory usage"
**Symptoms:**
- RAM usage climbing over time
- Server gets slower over time
- Eventually crashes

**Causes:**
1. Memory leak in code
2. Not cleaning up Socket.IO connections
3. Too many markers in memory
4. Array growing unbounded

**Solutions:**
```bash
# 1. Check for memory leaks in code
# Look for:
# - setInterval without clearInterval
# - socket listeners without socket.off()
# - Growing arrays without cleanup

# 2. Monitor with Node profiler
node --inspect app.js

# Then open chrome://inspect
# Profiles → Heap snapshot
# See what's taking memory

# 3. Restart server periodically
# Use PM2 with watch
pm2 start app.js --cron "0 2 * * *"  # Restart daily at 2 AM

# 4. Check Socket.IO listeners
# In server code, disconnect event should:
# - Remove from connectedUsers
# - Remove Socket.IO listeners

# 5. Limit marker storage
# Don't keep old markers forever
# Clear markers not updated in 1 hour
```

---

## Multi-User Issues

### ❌ "Users can't see each other"
**Symptoms:**
- Two users logged in, different browsers
- User 1 sees their marker, not User 2
- User 2 sees their marker, not User 1

**Causes:**
1. Socket.IO not connected (both users)
2. Locations not being sent
3. Locations sent but not received
4. Same browser/cookies (not actually different)

**Solutions:**
```bash
# 1. Verify both are logged in
# Check both browsers show map + their location
# Both should have green marker

# 2. Check Socket.IO connected
# In each browser console:
console.log(socket.connected);  // Should be true

# If false:
# - Refresh page
# - Check server running
# - Check internet connection

# 3. Monitor Socket.IO events
# In browser 1:
socket.on('receive-location', (data) => {
  console.log('Received location from:', data.username);
});

# Wait for location updates from User 2
# Should see every 5 seconds

# 4. Verify different users
# Check each browser shows different username
# Window 1: "johndoe"
# Window 2: "janesmith"
# Not actual different users if using same account!

# 5. Check server sees both
# Server terminal should show:
# 📍 Location from user1: {...}
# 📍 Location from user2: {...}
# Every 5 seconds (alternating or rapid)

# If not seeing updates from user2:
# - User2 not sending location
# - Check user2 has GPS permission
# - Check user2 page shows location updates (check browser console)
```

### ❌ "Locations update only for own user"
**Symptoms:**
- Your location updates fine
- Other users' markers stay in old position
- Or don't appear at all

**Causes:**
1. Socket.IO broadcast not working
2. Other users not sending locations
3. Browser not listening for events
4. Marker update code has bug

**Solutions:**
```bash
# 1. Check other users sending locations
# In their browser console:
// Should show location updates
socket.emit('send-location', {...});

# If not sending:
# - Location tracking not started
# - Check initializeLocationTracking() called
# - Refresh their page

# 2. Check broadcast on server
# Server terminal should show:
# 📍 Location from [user1]:
# 📍 Location from [user2]:
# Both users' locations logged

# If only seeing one:
# - Other user not sending
# - Ask them to check GPS permission
# - Ask them to refresh page

# 3. Check event listener
# In receiving browser console:
socket.on('receive-location', (data) => {
  if (data.userId !== myUserId) {
    console.log('Should update marker for:', data.userId);
  }
});

# Move the other user around
# Should log location updates for them

# 4. Check marker update code
# Look in views/home.ejs script section
# Function updateOrCreateMarker should:
# - Get existing marker OR
# - Create new marker
# - Set lat/lng
# - Add to map
```

---

## Network/Connectivity Issues

### ❌ "WebSocket connection failed"
**Symptoms:**
- Error: "WebSocket connection to ... failed"
- No real-time updates
- Fallback to polling (slow)

**Causes:**
1. Server not running
2. Firewall blocking WebSocket
3. Proxy blocking upgrade
4. Wrong port number

**Solutions:**
```bash
# 1. Verify server running
# Terminal should show:
# 🚀 Server running on http://localhost:3000

# If not showing, start it:
npm run dev

# 2. Check network connectivity
# F12 → Network tab
# Look for connection to localhost:3000/socket.io
# Should see status "101 Switching Protocols"

# If seeing 404:
# - Server not on port 3000
# - app.js not starting Socket.IO

# 3. Check firewall
# Windows: Windows Defender → Firewall → Allow app
# Mac: System Preferences → Security & Privacy
# Make sure Node.js allowed

# 4. Try different network
# Switch from WiFi to mobile hotspot
# If works on different network:
# - Your WiFi/ISP blocking WebSocket

# 5. Increase timeout
# In app.js, set longer timeout:
const io = socketio(server, {
  transports: ['websocket', 'polling'],
  pingTimeout: 60000
});
```

---

## Deployment Issues

### ❌ "Can't access app from other computer"
**Symptoms:**
- Works on localhost:3000
- Can't access from 192.168.x.x:3000
- Or from public domain

**Causes:**
1. Firewall blocking port
2. App listening on localhost only
3. Port not open

**Solutions:**
```bash
# 1. Get your computer's IP
ipconfig getifaddr en0  # Mac
ipconfig | findstr IPv4  # Windows
ip addr | grep inet    # Linux

# Example: 192.168.1.100

# 2. Try accessing from other computer
http://192.168.1.100:3000

# If doesn't work:

# 3. Check server listening on right interface
# app.js should have:
server.listen(port, '0.0.0.0');  # Listen on all interfaces
# Not: localhost (only local)

# 4. Check firewall
# Windows: Windows Defender → Allow app
# Mac: System Preferences → Firewall
# Allow Node.js port 3000

# 5. Check port open
# netstat -an | grep 3000
# Should show LISTEN state
```

---

## FAQ - Frequently Asked Questions

### Q: Can I use this in production?
**A:** Yes! It's production-ready. Before deploying:
- Change JWT_SECRET to strong random value
- Use HTTPS/SSL certificate
- Configure MongoDB Atlas (not localhost)
- Set NODE_ENV=production
- Use process manager (PM2)

### Q: How many users can this support?
**A:** 
- Single server: 100-500 concurrent users
- Multiple servers: 1000+ with Redis + load balancing
- Database: MongoDB Atlas free tier good for testing
- Consider sharding at 10,000+ users

### Q: Can I add friends-only locations?
**A:** Yes! Change location endpoint to check friendship:
```javascript
// In locationController
const isFriend = await Friendship.findOne({
  $or: [
    { requestFrom: userId, requestTo: targetUserId, status: 'accepted' },
    { requestFrom: targetUserId, requestTo: userId, status: 'accepted' }
  ]
});
if (!isFriend) return res.status(403).json({ error: 'Not friends' });
```

### Q: How do I add more map features?
**A:** Use Leaflet.js plugins:
```javascript
// Heat map
L.heatLayer(latLngArray).addTo(map);

// Marker clustering
new L.MarkerClusterGroup().addTo(map);

// Routing
L.Routing.control([startLatLng, endLatLng]).addTo(map);
```

### Q: Can I store location history?
**A:** Yes! Already implemented:
```javascript
// Get user's history
GET /api/location/history/:userId

// Shows all past locations with timestamps
```

### Q: How do I zoom to specific user?
**A:** Click their username in sidebar, or:
```javascript
map.setView([latitude, longitude], 15);
```

### Q: Can I add dark mode?
**A:** CSS variables in style.css:
```css
:root {
  --dark: #0f172a;
  --blue: #3b82f6;
}

@media (prefers-color-scheme: dark) {
  body { background: var(--dark); }
}
```

### Q: How do I reset the database?
```bash
# MongoDB Atlas
# Collections → Delete Database

# Local MongoDB
# mongod
# mongo geotrack
# db.dropDatabase()
```

### Q: Can I use custom markers?
**A:** Yes! In script.js:
```javascript
const customIcon = L.icon({
  iconUrl: 'custom-icon.png',
  iconSize: [32, 32]
});
L.marker([lat, lng], { icon: customIcon }).addTo(map);
```

### Q: How do I backup location data?
```bash
# MongoDB Atlas: automated backups
# Local: mongodump backup.dump
# Restore: mongorestore backup.dump
```

---

## Getting More Help

### Check These Resources
1. **Server Logs**: `npm run dev` → watch terminal
2. **Browser Console**: F12 → Console tab
3. **Network Tab**: F12 → Network → check requests
4. **Socket.IO Docs**: socket.io/docs
5. **MongoDB Docs**: docs.mongodb.com

### Ask Questions with Details
When posting for help, include:
1. Exact error message
2. Steps to reproduce
3. Expected vs actual behavior
4. Code snippet if applicable
5. Environment (.env variables, Node version, etc)

---

**Last Updated**: May 2026 | **Status**: ✅ Complete
