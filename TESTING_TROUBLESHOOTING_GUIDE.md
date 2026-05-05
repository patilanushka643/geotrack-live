# ✅ Testing & Troubleshooting Guide

## Quick Diagnosis

### 🔍 Check Browser Console (F12)

Open DevTools and look for these messages:

#### ✅ Working Correctly:
```
✅ Google Maps initialized successfully
✅ Got current position: {latitude, longitude, accuracy}
✅ Location sent to server
✅ User connected: [socketId]
```

#### ❌ Common Errors:
```
❌ Google Maps API not available
❌ Location permission denied
❌ Failed to fetch location
🚨 Geolocation error: GeolocationPositionError
```

---

## Issue Diagnosis Table

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Oops! Something went wrong. This page didn't load Google Maps correctly" | Invalid API key | [See GOOGLE_MAPS_SETUP_GUIDE.md](#google-maps-setup-guide) |
| "Google Maps not available" | API not loaded | Get valid API key |
| "Location permission denied" | Browser blocked geolocation | [Allow in browser settings](#geolocation-setup-guide) |
| "Unable to access your location" | No GPS/Wi-Fi signal | Check Wi-Fi/GPS is on |
| "Location not available for this user" | Friend hasn't shared location | Ask friend to enable sharing |
| "Failed to fetch location" | Backend error | Check server console |

---

## Test Scenarios

### Test 1: Basic Setup Verification (5 minutes)

**Objective:** Verify system is running and database is connected

**Steps:**
1. Start server: `npm start`
2. Open browser: `http://localhost:3000`
3. Look for database connection message in terminal:
   ```
   ✅ Database connected
   🚀 Server running on http://localhost:3000
   ```

**Expected Results:**
- ✅ Login page loads
- ✅ Can navigate to signup
- ✅ No 500 errors in console

---

### Test 2: Google Maps Configuration (5 minutes)

**Objective:** Verify Google Maps API is loading correctly

**Steps:**
1. Login to account
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for messages about Google Maps

**Expected Results:**
- If API key is valid:
  ```
  ✅ Google Maps API loaded successfully!
  ✅ Google Maps initialized successfully
  ```
- If API key is invalid:
  ```
  ⚠️ Google Maps API not yet loaded, waiting for callback...
  ❌ Google Maps API is not available
  ```

**If Invalid:**
1. Go to [GOOGLE_MAPS_SETUP_GUIDE.md](./GOOGLE_MAPS_SETUP_GUIDE.md)
2. Get valid API key from Google Cloud Console
3. Update `views/home.ejs` line 10
4. Reload page

---

### Test 3: Geolocation Permission (5 minutes)

**Objective:** Enable browser geolocation and verify permission

**Steps:**
1. Login to account
2. Look for notification at top of page:
   - Option 1: "Location permission denied..." → Click to enable
   - Option 2: Browser shows permission prompt → Click "Allow"
3. Reload page if needed
4. Check DevTools console

**Expected Results:**
- ✅ Permission prompt appears or notification in app
- ✅ After allowing:
  ```
  ✅ Got current position: {latitude: 37.2345, longitude: -122.1234, accuracy: 15}
  📍 Updating location for user: [userId]
  ✅ Location sent to server
  ```

**If Still Denied:**
1. Check browser permission settings (see GEOLOCATION_SETUP_GUIDE.md)
2. Make sure "Allow" not "Block"
3. Clear browser cache and reload
4. Try in incognito/private mode

---

### Test 4: Real-Time Location Tracking (10 minutes)

**Objective:** Verify your location appears on map

**Steps:**
1. Login as Alice
2. Allow geolocation permission
3. Wait 5-10 seconds
4. Look at map on right side
5. Check DevTools console

**Expected Results:**
- ✅ Green marker (🟢) appears on map showing your location
- ✅ Console shows:
  ```
  ✅ Got current position...
  ✅ Location sent to server
  📍 Updating my marker: {latitude, longitude}
  ➕ Creating my marker
  ```
- ✅ Marker updates every 5 seconds as location changes

**If Marker Doesn't Appear:**
1. Check if map itself loaded (not showing error)
2. Verify geolocation permission is granted
3. Check terminal for backend errors: `📍 Updating location for user`
4. Check that location sharing toggle is ON (should be green)

---

### Test 5: Viewing Friend's Location (10 minutes)

**Objective:** Click friend and see their location on map

**Prerequisites:**
- ✅ Two user accounts registered (Alice and Bob)
- ✅ Both users logged in (in separate browsers/windows)
- ✅ Both have geolocation enabled
- ✅ Both have location sharing ON (toggle is green)
- ✅ Both have waited 5+ seconds for location to sync

**Steps:**

**Setup (First Time Only):**
1. Terminal: `npm start` (make sure server is running)
2. Open Browser 1: Login as Alice
3. Allow geolocation permission
4. Wait 5 seconds
5. Open Browser 2: Login as Bob (separate browser window)
6. Allow geolocation permission
7. Wait 5 seconds

**Actual Test:**
1. In Alice's browser (Browser 1)
2. Look at "Friends (4)" list on left
3. Find Bob's name
4. Click on Bob's name
5. Look at map on right

**Expected Results:**
- ✅ "Fetching location..." spinner shows briefly
- ✅ Map pans to Bob's location
- ✅ Blue marker (🔵) appears with info window
- ✅ Info window shows:
  ```
  Bob Smith
  📍 37.7749, -122.4194
  📧 bob@test.com
  ⏱️ 10:30:45 AM
  🟢 Online
  ```
- ✅ Console shows:
  ```
  👤 Selected user: {userId: "...", username: "bob", fullName: "Bob Smith"}
  📡 Fetching location from: /api/location/user/[userId]
  📥 API Response: {success: true, user: {...}}
  ✅ Got user location: {...}
  🗺️ Viewing location on map: ...
  📍 Moving map to: {lat: 37.7749, lng: -122.4194}
  ➕ Creating new marker
  ```

---

### Test 6: Real-Time Location Updates (15 minutes)

**Objective:** Verify location updates in real-time via Socket.io

**Prerequisites:**
- ✅ Test 5 completed successfully

**Steps:**
1. In Alice's browser: Look at Bob's location on map
2. In Bob's browser: Use DevTools to simulate location change (see Test 8)
3. Back in Alice's browser: Watch map for updates

**Expected Results:**
- ✅ Bob's marker moves to new location
- ✅ Info window updates with new coordinates and time
- ✅ Console shows:
  ```
  📍 Location received via socket: {userId: "...", latitude: 37.8, longitude: -122.5, ...}
  📍 Adding/Updating marker: ...
  🔄 Updating marker for: Bob
  ```

**If No Update:**
1. Check both Socket.io connections in console: `✅ User connected`
2. Verify Bob's location is updating on server: check terminal for `📍 Updating location`
3. Check Bob has location sharing ON (toggle green)

---

### Test 7: Location Sharing Toggle (5 minutes)

**Objective:** Verify location sharing can be disabled

**Steps:**
1. Login as Alice
2. Look for "📍 Share Location" toggle on left
3. Toggle OFF (it turns red)
4. In Bob's browser: Try to view Alice's location
5. Check console for response

**Expected Results:**
- ✅ When ON: Shows location on map
- ✅ When OFF:
  - Alice's location doesn't update on server
  - Friends see: "Location not available for this user"
  - Console shows: `⚠️ User has no location data: Alice`

---

### Test 8: Geolocation Simulation (For Testing Without GPS)

**Objective:** Test with simulated locations

**Chrome/Edge:**
1. Open DevTools (F12)
2. Click **⋯ Menu** (top-right)
3. Click **More tools** → **Sensors**
4. Find "Location" dropdown
5. Select a predefined location or enter custom:
   - Latitude: 40.7128
   - Longitude: -74.0060
6. Reload page
7. Watch map update to new location

**Firefox:**
1. Open DevTools (F12)
2. Click **Inspector** tab
3. Click **Responsive Design Mode** (Ctrl+Shift+M)
4. Click **⋯ Menu** → **Settings**
5. Check "Simulate geolocation coordinates"
6. Enter coordinates
7. Reload page

**Expected Results:**
- ✅ Location updates to simulated coordinates
- ✅ Map centers on new location
- ✅ Friend's browser shows updated location

---

### Test 9: Error Handling - Denied Permission (5 minutes)

**Objective:** Verify graceful error handling

**Steps:**
1. Open new browser/incognito window
2. Go to `http://localhost:3000/signup`
3. Create test account
4. Login
5. When geolocation prompt appears: Click **Block/Deny**
6. Check DevTools console

**Expected Results:**
- ✅ Error message appears: "Location permission denied"
- ✅ Console shows:
  ```
  🚨 Geolocation error: GeolocationPositionError
  📍 Error details: {code: 1, message: "User denied Geolocation", ...}
  ```
- ✅ App continues to work (can still see friends' locations)

---

### Test 10: Multiple Concurrent Users (20 minutes)

**Objective:** Verify system works with multiple users

**Setup:**
1. Open 3 browser windows/tabs
2. Create 3 test accounts:
   - Alice (alice@test.com)
   - Bob (bob@test.com)
   - Charlie (charlie@test.com)
3. Login as each user in separate window
4. Allow geolocation in all 3

**Testing:**
1. In Alice's window: Click Bob → See Bob's location
2. In Alice's window: Click Charlie → See Charlie's location
3. In Bob's window: Click Alice → See Alice's location
4. Modify location in Chrome DevTools (Sensors tab)
5. Watch other users' browsers update real-time

**Expected Results:**
- ✅ All markers appear on correct locations
- ✅ Clicking different users updates map
- ✅ Location changes propagate via Socket.io
- ✅ No errors in any browser console
- ✅ Terminal shows all connections:
  ```
  ✅ User connected: [socketId1]
  ✅ User connected: [socketId2]
  ✅ User connected: [socketId3]
  📍 User [id1] joined location sharing
  📍 User [id2] joined location sharing
  📍 User [id3] joined location sharing
  ```

---

## Database Verification

### Check Location Data Stored

**Using MongoDB Compass or mongo shell:**

```javascript
// See all users with locations
db.users.find({ latitude: { $exists: true } }).pretty()

// Expected output:
{
  _id: ObjectId("..."),
  email: "alice@test.com",
  fullName: "Alice Johnson",
  userId: "alice_123",
  latitude: 37.7749,
  longitude: -122.4194,
  locationLastUpdated: ISODate("2026-04-29T10:30:00.000Z"),
  isLocationSharing: true,
  // ... other fields
}
```

### Check Location History

```javascript
// See location history
db.locationhistories.find({ userId: ObjectId("...") }).limit(10).pretty()

// Expected output:
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 15.5,
  createdAt: ISODate("2026-04-29T10:30:00.000Z")
}
```

---

## Performance Checks

### Expected Performance:

| Operation | Expected Time | If Slower |
|-----------|---------------|-----------|
| Map load | < 1 second | Check Google Maps API connection |
| Geolocation update | 5-10 seconds first, then every 5 sec | Normal GPS latency |
| Friend location fetch | < 500ms | Check database indexes |
| Marker update (Socket.io) | < 100ms | Check network latency |
| Zoom/pan map | Instant | Normal browser behavior |

### Browser Memory:
- Initial page load: 50-100 MB
- With 10 markers: 100-150 MB
- Should not exceed 300 MB (memory leak investigation needed)

---

## Logs to Check

### Terminal Output:
```bash
✅ Database connected          # Must show
🚀 Server running...           # Must show
✅ User connected: [socketId]  # For each login
📍 User joined location        # For each geolocation start
📍 Updating location for user  # Should see every 5 sec
```

### Browser Console:
```javascript
✅ Google Maps initialized     # Must show
✅ Got current position        # Should see every 5 sec
✅ Location sent to server     # Should see every 5 sec
📡 Fetching location from...   # When clicking friend
📍 Viewing location on map     # When friend selected
```

---

## Common Test Failures

### Issue: Map shows "Oops! Something went wrong"

**Checklist:**
- [ ] Google Maps API key is valid?
- [ ] Maps JavaScript API enabled in Google Cloud?
- [ ] Billing enabled?
- [ ] API key restrictions correct?
- [ ] console shows specific error (InvalidKeyMapError)?

**Fix:** Follow [GOOGLE_MAPS_SETUP_GUIDE.md](./GOOGLE_MAPS_SETUP_GUIDE.md)

---

### Issue: "Location permission denied" persists

**Checklist:**
- [ ] Clicked "Allow" in browser prompt?
- [ ] Browser settings show "Allow" not "Block"?
- [ ] Not in private/incognito mode?
- [ ] Tried clearing browser cache?
- [ ] Tried different browser?

**Fix:** Follow [GEOLOCATION_SETUP_GUIDE.md](./GEOLOCATION_SETUP_GUIDE.md)

---

### Issue: Friend's location shows "not available"

**Checklist:**
- [ ] Friend has location sharing enabled (toggle ON)?
- [ ] Friend allowed geolocation permission?
- [ ] Friend waited 5+ seconds?
- [ ] Both users are online?
- [ ] Database has location data?

**Fix:** Have friend enable sharing and wait 10 seconds

---

## Test Completion Checklist

- [ ] Test 1: Basic Setup ✅
- [ ] Test 2: Google Maps Config ✅
- [ ] Test 3: Geolocation Permission ✅
- [ ] Test 4: Location Tracking ✅
- [ ] Test 5: Friend Location Viewing ✅
- [ ] Test 6: Real-Time Updates ✅
- [ ] Test 7: Location Sharing Toggle ✅
- [ ] Test 8: Simulated Locations ✅
- [ ] Test 9: Error Handling ✅
- [ ] Test 10: Multiple Users ✅
- [ ] Database verification ✅
- [ ] Performance acceptable ✅
- [ ] No console errors ✅

---

## Summary

**Total Testing Time:** ~2 hours (includes all tests)

**Critical Issues:** Must fix Tests 1-5 before deployment

**Nice-to-Have Tests:** Tests 6-10 for comprehensive validation

---

**Last Updated:** 2026-04-29
