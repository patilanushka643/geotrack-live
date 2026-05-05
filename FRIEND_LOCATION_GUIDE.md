# 🗺️ GeoTrack Friend Location System - Implementation Guide

## 📋 Overview

This guide walks you through the enhanced **Friend-Based Location Viewing System** added to GeoTrack. The system allows users to:

- ✅ Add and manage friends
- ✅ Send/accept friend requests
- ✅ View selected friends' locations on a map
- ✅ Multi-user location display with color-coded markers
- ✅ Real-time location updates via Socket.IO
- ✅ Security: Only see friends' locations (not all users)

---

## 🚀 What's New

### Backend Changes

1. **New Model**: `Friendship.js` - Manages friend relationships
2. **Updated Model**: `User.js` - Added `friendList` array
3. **New Controller**: `friendController.js` - All friend operations
4. **New Routes**: `/api/friends` - Friend management endpoints
5. **Updated Location Controller**: Added permission validation

### Frontend Changes

1. **Enhanced Home Page**: `views/home-enhanced.ejs`
   - Multi-friend selection with checkboxes
   - Add friend modal with search
   - Multiple markers on map
   - Friend management UI
   - Better UX/layout

2. **Socket.IO Integration**: Real-time location updates for selected friends only

---

## 📡 API Endpoints

### Friend Management Endpoints

#### 1. **Get Friends List**
```
GET /api/friends/
Authentication: Required
Response: { success, friends: [...] }
```
Returns all friends with their location data.

#### 2. **Get Friend's Location**
```
GET /api/friends/:friendId/location
Authentication: Required
Response: { success, friend: { id, fullName, latitude, longitude, locationLastUpdated } }
```
Get specific friend's current location (with permission check).

#### 3. **Send Friend Request**
```
POST /api/friends/request/send
Body: { targetUserId: "..." }
Response: { success, friendship: { id, status, createdAt } }
```
Send a friend request to another user.

#### 4. **Accept Friend Request**
```
POST /api/friends/request/accept
Body: { friendshipId: "..." }
Response: { success, friendship: { id, status, updatedAt } }
```
Accept a pending friend request.

#### 5. **Reject Friend Request**
```
POST /api/friends/request/reject
Body: { friendshipId: "..." }
Response: { success }
```
Reject or cancel a friend request.

#### 6. **Remove Friend**
```
POST /api/friends/:friendId/remove
Authentication: Required
Response: { success }
```
Remove a friend from your friend list.

#### 7. **Get Pending Requests**
```
GET /api/friends/requests/pending
Authentication: Required
Response: { success, requests: [...] }
```
Get all pending friend requests.

---

## 🛠️ Installation & Setup

### Step 1: Install Dependencies (Already in package.json)

```bash
npm install
```

Required packages:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - Real-time communication
- `jsonwebtoken` - Authentication
- `bcryptjs` - Password hashing
- `leaflet` - Map library (frontend)

### Step 2: Update Database Connection

Ensure `.env` file has:
```
MONGO_URI=mongodb://localhost:27017/geotrack
JWT_SECRET=your_secret_key
```

### Step 3: Start the Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

Server runs on `http://localhost:3000` (or your configured port)

---

## 💻 Usage Workflow

### For End Users

#### Adding a Friend
1. Click "➕ Add" button in the sidebar
2. Search for a user by name
3. Click "+ Add" button next to their name
4. Friend request is sent
5. User accepts the request
6. Friend appears in your friends list

#### Viewing Friends' Locations
1. Check the checkbox next to a friend's name
2. Their location marker appears on the map
3. Multiple friends can be selected simultaneously
4. Click "✕ Clear" to deselect all

#### Removing a Friend
1. Click the "🗑️" button on a friend's item
2. Confirm removal
3. Friend is removed from your list

#### Enabling/Disabling Location Sharing
1. Toggle the "📍 Share Location" switch
2. When enabled: Your location updates every 5 seconds
3. When disabled: Your location is hidden from friends

---

## 📊 Data Models

### Friendship Model
```javascript
{
  user1: ObjectId,           // First user
  user2: ObjectId,           // Second user
  status: "pending|accepted|blocked",
  requestedBy: ObjectId,     // Who sent the request
  createdAt: Date,
  updatedAt: Date
}
```

### User Model (Updated)
```javascript
{
  // ... existing fields ...
  friendList: [ObjectId],    // Array of friend IDs
  latitude: Number,
  longitude: Number,
  locationLastUpdated: Date,
  isLocationSharing: Boolean
}
```

---

## 🔐 Security Considerations

### Implemented Security Features

1. **Authentication**: All endpoints require valid JWT token
2. **Friend Validation**: Users can only view friends' locations
3. **Permission Checks**: Backend validates relationships before returning data
4. **Location Sharing Toggle**: Users control if their location is shared
5. **Rate Limiting** (Optional): Implement on friend request endpoint

### Best Practices

```javascript
// Always validate friendship before showing location
const isFirend = user.friendList.includes(targetUserId);
if (!isFriend) {
  return res.status(403).json({ success: false, message: "Not authorized" });
}
```

---

## 🗺️ Map Features

### Multiple Markers
- Each selected friend gets a unique color-coded marker
- Hover over marker to see detailed location info
- Automatic map bounds fitting for all markers

### Real-Time Updates
- Locations update every 5 seconds via geolocation API
- Socket.IO broadcasts to all connected clients
- Only selected friends' markers update (optimized)

### Map Controls
- Zoom in/out
- Pan around
- Click markers for details
- Automatic fit-to-bounds when adding friends

---

## 🧪 Testing Guide

### Test Case 1: Add Friend

1. **Create 2 Test Accounts**
   - User A: email: `alice@test.com`, password: `password123`
   - User B: email: `bob@test.com`, password: `password123`

2. **Login as User A**
   ```
   Navigate to /login
   Enter alice@test.com credentials
   ```

3. **Send Friend Request**
   ```
   Click "➕ Add" button
   Search for "bob"
   Click "+ Add"
   See "Friend request sent!" message
   ```

4. **Login as User B (New Tab)**
   ```
   Open new incognito tab
   Navigate to /login
   Enter bob@test.com credentials
   ```

5. **Accept Request**
   ```
   (Backend can auto-accept for testing, or add frontend UI)
   Both users should see each other in friends list
   ```

### Test Case 2: View Friend Location

1. **Both Users Enabled Location Sharing**
   ```
   Both users should have "📍 Share Location" toggle ON
   ```

2. **User A Selects User B**
   ```
   Check checkbox next to User B's name
   User B's location marker should appear on map
   Should show green/blue marker with popup
   ```

3. **Real-Time Update**
   ```
   User B moves to new location
   Marker updates automatically (5-second interval)
   User A sees new location without refreshing
   ```

### Test Case 3: Multiple Friends

1. **Add 3+ Friends**
   ```
   Follow "Add Friend" test case for 3 different users
   All should appear in friends list
   ```

2. **Select Multiple Friends**
   ```
   Check 2-3 friends simultaneously
   Multiple markers appear on map with different colors
   "Selected: 3" shows in header
   ```

3. **Clear Selection**
   ```
   Click "✕ Clear" button
   All markers disappear
   Placeholder message reappears
   ```

### Test Case 4: Remove Friend

1. **Remove a Friend**
   ```
   Click 🗑️ on a friend
   Confirm removal
   Friend disappears from list
   Their marker removed from map
   ```

### Test Case 5: Disable Location Sharing

1. **Toggle OFF**
   ```
   Click "📍 Share Location" toggle
   Should show "disabled" message
   User's location should not update
   Friends can't see this user's location
   ```

2. **Toggle Back ON**
   ```
   Click toggle again
   Should show "enabled" message
   Location updates resume
   ```

---

## 🐛 Troubleshooting

### Friend Request Not Sending
```
✓ Check both users are verified (email confirmed)
✓ Ensure JWT token is valid
✓ Check MongoDB connection
✓ Verify `targetUserId` format
```

### Can't See Friend's Location
```
✓ Ensure friend has location sharing ENABLED
✓ Check friend has updated location recently (< 60 seconds)
✓ Verify friend relationship exists in database
✓ Check Socket.IO connection is active
```

### Map Not Displaying
```
✓ Check browser console for errors
✓ Verify Leaflet library loaded correctly
✓ Check coordinates are valid (lat: -90 to 90, lng: -180 to 180)
✓ Ensure Geolocation API is enabled in browser
```

### Location Not Updating
```
✓ Check geolocation is enabled in browser
✓ Verify "📍 Share Location" toggle is ON
✓ Check browser console for geolocation errors
✓ Ensure network connection is active
```

---

## 📈 Performance Optimization

### Current Implementation
- Location updates: Every 5 seconds
- Only updates for selected friends (not all users)
- Socket.IO filtering on backend
- Efficient marker update (setLatLng vs recreate)

### Optional Optimizations

1. **Clustering (Many Friends)**
   ```javascript
   // Add Leaflet MarkerCluster plugin
   npm install leaflet.markercluster
   ```

2. **Location History**
   ```javascript
   // Already stored in LocationHistory collection
   // Can draw polyline of friend's path
   ```

3. **Distance Calculation**
   ```javascript
   // Add distance display between current user and friends
   function calculateDistance(lat1, lon1, lat2, lon2) {
     // Haversine formula
   }
   ```

4. **Caching**
   ```javascript
   // Cache friend list for 30 seconds
   let cachedFriends = null;
   let cacheTime = null;
   ```

---

## 🔄 Real-Time Architecture

### Socket.IO Events

**Client → Server**
```javascript
socket.emit('user-join', { userId, username })
socket.emit('send-location', { userId, latitude, longitude, accuracy })
```

**Server → Client**
```javascript
socket.on('user-joined', { userId, username, timestamp })
socket.on('receive-location', { userId, latitude, longitude, accuracy, timestamp })
socket.on('user-disconnected', { userId })
```

### Location Update Flow
```
Browser Geolocation API
    ↓
POST /api/location/update (save to DB)
    ↓
Socket.IO emit 'send-location'
    ↓
Server broadcasts 'receive-location'
    ↓
Connected clients update markers
```

---

## 📝 Database Queries

### Find All Friends of a User
```javascript
User.findById(userId)
  .populate('friendList', 'fullName userId email latitude longitude')
  .exec()
```

### Check if Two Users are Friends
```javascript
const isFriend = user.friendList.includes(targetUserId);
```

### Get Friend Requests for User
```javascript
Friendship.find({
  user2: userId,
  status: 'pending'
}).populate('user1', 'fullName userId email')
```

---

## 🚢 Deployment

### Environment Variables (.env)
```
MONGO_URI=mongodb://prod-server:27017/geotrack
JWT_SECRET=your-production-secret-key
PORT=3000
NODE_ENV=production
```

### Database Indexing
```javascript
// Already defined in models:
// - FriendshipSchema: unique on (user1, user2)
// - UserSchema: unique on userId
// - LocationHistorySchema: TTL on expiresAt
```

### Production Checklist
```
✓ Enable HTTPS/TLS
✓ Set secure JWT_SECRET (32+ characters)
✓ Configure CORS properly
✓ Enable rate limiting
✓ Setup MongoDB backups
✓ Monitor Socket.IO connections
✓ Configure browser geolocation HTTPS requirement
✓ Setup error logging (Sentry, etc.)
```

---

## 📚 Additional Resources

### Libraries Used
- **Leaflet.js**: Interactive maps (https://leafletjs.com/)
- **Socket.IO**: Real-time communication
- **Mongoose**: MongoDB object modeling
- **Express.js**: Web framework
- **JWT**: Token-based auth

### Optional Enhancements
- [ ] Dark/Light theme toggle
- [ ] Geofencing (notifications when friend enters area)
- [ ] Distance display between users
- [ ] Location history polylines
- [ ] Friend request notifications
- [ ] Privacy levels (public/friends/private)
- [ ] Map tile options (satellite, terrain, etc.)
- [ ] Export location data

---

## 🎓 Code Examples

### Example: Custom Friend Endpoint
```javascript
// Extend friend controller
router.post('/friends/block', async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.userId;
  
  await Friendship.findOneAndUpdate(
    { $or: [{ user1: userId, user2: friendId }] },
    { status: 'blocked' }
  );
  
  res.json({ success: true });
});
```

### Example: Distance Display
```javascript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}
```

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review browser console for errors
3. Check MongoDB connection
4. Verify all routes are registered in `app.js`
5. Clear browser cache and reload

---

**Last Updated**: April 2026  
**Version**: 2.0 (Multi-Friend Support)
