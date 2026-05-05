# 📡 GeoTrack - Complete API & Socket.IO Reference

## Table of Contents
1. [REST API Endpoints](#rest-api-endpoints)
2. [Socket.IO Events](#socketio-events)
3. [Data Models](#data-models)
4. [Real-Time Flow Diagrams](#real-time-flow-diagrams)
5. [Error Codes](#error-codes)
6. [Code Examples](#code-examples)

---

## REST API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints (`/api`)

#### 1. Send OTP
Send a 6-digit OTP to user's email for signup.

```http
POST /send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

---

#### 2. Verify OTP & Register
Verify OTP code and create new account.

```http
POST /verify-and-register
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "fullName": "John Doe",
  "userId": "johndoe",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "userId": "johndoe"
  }
}
```

**Errors:**
- `400`: Invalid OTP
- `400`: User already exists
- `400`: Missing required fields

---

#### 3. Login
Authenticate user with email and password.

```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "userId": "johndoe"
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `404`: User not found

**Token Storage:**
- Automatically set in cookie: `authToken`
- Or save manually: `localStorage.setItem('authToken', token)`

---

#### 4. Logout
Clear authentication session.

```http
POST /logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Location Endpoints (`/api/location`)

**All location endpoints require authentication:**
```http
Headers: Cookie: authToken={jwt_token}
        OR
Authorization: Bearer {jwt_token}
```

#### 1. Update Current Location
Called frequently by frontend (every 5 seconds).

```http
POST /update
Content-Type: application/json
Cookie: authToken={jwt_token}

{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 5
}
```

**Response (200):**
```json
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

**Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Both required

**Called By:** Frontend's `updateLocationToBackend()` every 5 seconds

---

#### 2. Get All Users with Locations
Fetch all verified users and their current locations.

```http
GET /users
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users list retrieved successfully",
  "count": 3,
  "users": [
    {
      "id": "507f1f77bcf86cd799439012",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "latitude": 37.8044,
      "longitude": -122.2712,
      "locationLastUpdated": "2026-05-01T10:30:00.000Z",
      "isLocationSharing": true,
      "isOnline": true
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "fullName": "Bob Johnson",
      "username": "bobjohnson",
      "email": "bob@example.com",
      "latitude": 37.7849,
      "longitude": -122.4094,
      "locationLastUpdated": "2026-05-01T10:15:00.000Z",
      "isLocationSharing": true,
      "isOnline": false
    }
  ]
}
```

**Online Status Logic:**
- **Online**: Location updated <60 seconds ago
- **Offline**: Location not updated for >60 seconds

---

#### 3. Get All Users (Registered)
Get all users who have ever logged in (with location if available).

```http
GET /all-users
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "username": "johndoe",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "isLocationSharing": true
    }
  ]
}
```

---

#### 4. Get Active Users Only
Get users currently sharing their location (within last 5 minutes).

```http
GET /active
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Active users retrieved successfully",
  "activeUsers": [
    {
      "id": "507f1f77bcf86cd799439012",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "latitude": 37.8044,
      "longitude": -122.2712,
      "isLocationSharing": true,
      "lastUpdate": "2026-05-01T10:30:00.000Z"
    }
  ]
}
```

---

#### 5. Get Location Sharing Status
Quick check of who is sharing location.

```http
GET /sharing-status
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "status": {
    "507f1f77bcf86cd799439011": true,
    "507f1f77bcf86cd799439012": false,
    "507f1f77bcf86cd799439013": true
  }
}
```

---

#### 6. Get Specific User Location
Get a specific user's current location.

```http
GET /user/:userId
Cookie: authToken={jwt_token}
```

**Example:**
```http
GET /user/507f1f77bcf86cd799439012
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439012",
    "fullName": "Jane Smith",
    "username": "janesmith",
    "latitude": 37.8044,
    "longitude": -122.2712,
    "isLocationSharing": true,
    "lastUpdated": "2026-05-01T10:30:00.000Z"
  }
}
```

---

#### 7. Get My Current Location
Get logged-in user's own location data.

```http
GET /my-location
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "lastUpdated": "2026-05-01T10:30:00.000Z"
  }
}
```

---

#### 8. Toggle Location Sharing
Enable or disable location sharing for current user.

```http
POST /toggle-sharing
Content-Type: application/json
Cookie: authToken={jwt_token}

{
  "isSharing": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Location sharing enabled",
  "isLocationSharing": true
}
```

**Broadcast:** Emits Socket.IO event to all users

---

#### 9. Get Location History
Get historical location data for a user.

```http
GET /history/:userId
Cookie: authToken={jwt_token}
```

**Query Parameters:**
```http
GET /history/:userId?limit=10&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "message": "Location history retrieved",
  "history": [
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 5,
      "timestamp": "2026-05-01T10:30:00.000Z"
    },
    {
      "latitude": 37.7750,
      "longitude": -122.4195,
      "accuracy": 5,
      "timestamp": "2026-05-01T10:25:00.000Z"
    }
  ]
}
```

---

### Friend Endpoints (`/api/friends`)

**All friend endpoints require authentication.**

#### 1. Send Friend Request
Request to add another user as friend.

```http
POST /request
Content-Type: application/json
Cookie: authToken={jwt_token}

{
  "friendId": "507f1f77bcf86cd799439012"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request sent"
}
```

---

#### 2. Accept Friend Request
Accept an incoming friend request.

```http
POST /accept
Content-Type: application/json
Cookie: authToken={jwt_token}

{
  "friendId": "507f1f77bcf86cd799439012"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

---

#### 3. Reject Friend Request
Decline an incoming friend request.

```http
POST /reject
Content-Type: application/json
Cookie: authToken={jwt_token}

{
  "friendId": "507f1f77bcf86cd799439012"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

---

#### 4. Get My Friends
List all accepted friends with their current location.

```http
GET /my-friends
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "friends": [
    {
      "id": "507f1f77bcf86cd799439012",
      "fullName": "Jane Smith",
      "username": "janesmith",
      "email": "jane@example.com",
      "latitude": 37.8044,
      "longitude": -122.2712,
      "isOnline": true,
      "locationLastUpdated": "2026-05-01T10:30:00.000Z"
    }
  ]
}
```

---

#### 5. Get Pending Requests
Get incoming friend requests awaiting response.

```http
GET /pending-requests
Cookie: authToken={jwt_token}
```

**Response (200):**
```json
{
  "success": true,
  "pendingRequests": [
    {
      "id": "507f1f77bcf86cd799439013",
      "fullName": "Bob Johnson",
      "username": "bobjohnson",
      "email": "bob@example.com"
    }
  ]
}
```

---

#### 6. Remove Friend
Remove a user from friend list.

```http
POST /remove
Content-Type: application/json
Cookie: authToken={jwt_token}

{
  "friendId": "507f1f77bcf86cd799439012"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friend removed"
}
```

---

## Socket.IO Events

### Connection Flow

```
Browser                         Server
   |                              |
   |--- socket.io handshake ----->|
   |                              |
   |<-- "connection" confirmed ----|
   |                              |
   |--- "user-join" (userId) ----->|
   |                              |
```

### Client → Server Events

#### 1. User Join
Sent when user logs in (on page load).

```javascript
socket.emit("user-join", {
  userId: "507f1f77bcf86cd799439011",
  username: "johndoe",
  timestamp: new Date()
});
```

**Server processes:** Registers user in `connectedUsers` object

---

#### 2. Send Location
Sent every 5 seconds with current GPS position.

```javascript
socket.emit("send-location", {
  userId: "507f1f77bcf86cd799439011",
  username: "johndoe",
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 5,
  timestamp: new Date()
});
```

**Server broadcasts:** To ALL connected clients via `io.emit()`

---

#### 3. Update Online Status
Sent when user goes online/offline.

```javascript
socket.emit("update-online-status", {
  userId: "507f1f77bcf86cd799439011",
  isOnline: true
});
```

**Server broadcasts:** User status change event

---

#### 4. Location Sharing Toggle
Sent when user enables/disables location sharing.

```javascript
socket.emit("location-sharing-toggle", {
  userId: "507f1f77bcf86cd799439011",
  isSharing: false
});
```

**Server broadcasts:** Sharing status change

---

#### 5. Request Location
Request specific user to send location.

```javascript
socket.emit("request-location", {
  targetUserId: "507f1f77bcf86cd799439012",
  requestedBy: "507f1f77bcf86cd799439011",
  requestedByUsername: "johndoe"
});
```

**Server sends to:** Specific user's socket only

---

#### 6. Heartbeat (Keep-Alive)
Sent every 30 seconds to keep connection alive.

```javascript
socket.emit("heartbeat", {
  userId: "507f1f77bcf86cd799439011",
  timestamp: new Date()
});
```

**Server response:** None (passive keep-alive)

---

### Server → Client Events

#### 1. Receive Location
Broadcast when any user sends location update.

```javascript
socket.on("receive-location", function(data) {
  console.log("User location updated:", data);
  
  // data contains:
  // - userId: User's MongoDB ID
  // - username: User's login username
  // - latitude: Current latitude
  // - longitude: Current longitude
  // - accuracy: GPS accuracy in meters
  // - timestamp: Update timestamp
});
```

**Received by:** ALL connected clients

**Frequency:** Every 5 seconds per active user

---

#### 2. User Joined
Broadcast when new user connects.

```javascript
socket.on("user-joined", function(data) {
  console.log("New user connected:", data);
  
  // data contains:
  // - userId: New user's ID
  // - username: New user's username
  // - timestamp: Join timestamp
});
```

**Received by:** ALL connected clients

---

#### 3. User Disconnected
Broadcast when user logs out or connection lost.

```javascript
socket.on("user-disconnected", function(data) {
  console.log("User disconnected:", data.userId);
  
  // data contains:
  // - userId: Disconnected user's ID
  // - timestamp: Disconnect timestamp
});
```

**Received by:** ALL connected clients

---

#### 4. User Status Changed
Broadcast when user's online status changes.

```javascript
socket.on("user-status-changed", function(data) {
  // data contains:
  // - userId: User's ID
  // - isOnline: Boolean status
  // - timestamp: Change timestamp
});
```

---

#### 5. Friend List Updated
Broadcast when friend relationships change.

```javascript
socket.on("friend-list-updated", function(data) {
  // Updated friend list for current user
});
```

---

#### 6. Location Sharing Changed
Broadcast when user toggles location sharing.

```javascript
socket.on("location-sharing-changed", function(data) {
  // data contains:
  // - userId: User who changed setting
  // - isSharing: New sharing status
});
```

---

#### 7. Location Requested
Notification when another user requests your location.

```javascript
socket.on("location-requested", function(data) {
  // data contains:
  // - requestedBy: Requester's user ID
  // - requestedByUsername: Requester's username
});
```

**Received by:** Only the targeted user

---

## Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  
  // Account Info
  email: String (unique, lowercase),
  fullName: String,
  userId: String (username),
  passwordHash: String (bcrypted),
  
  // Verification
  isVerified: Boolean,
  otp: String (hashed),
  otpExpiry: Date,
  
  // Location Data
  latitude: Number,
  longitude: Number,
  locationLastUpdated: Date,
  isLocationSharing: Boolean,
  
  // Social
  friendList: [ObjectId],
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### LocationHistory Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  createdAt: Date
}
```

### Friendship Schema
```javascript
{
  _id: ObjectId,
  requestFrom: ObjectId (ref: User),
  requestTo: ObjectId (ref: User),
  status: String (pending, accepted, rejected),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Real-Time Flow Diagrams

### User Login Flow
```
1. User logs in (email + password)
   ↓
2. Server returns JWT token
   ↓
3. Browser navigates to /home
   ↓
4. GPS permission request appears
   ↓
5. Browser starts watchPosition()
   ↓
6. Socket.IO connects automatically
   ↓
7. Browser emits "user-join" event
   ↓
8. Server broadcasts "user-joined" to all
   ↓
9. Location updates every 5 seconds
   ↓
10. Browser emits "send-location"
    ↓
11. Server broadcasts "receive-location" to all
```

### Location Update Cycle (Every 5 Seconds)
```
Browser Gets GPS Position
         ↓
   POST /api/location/update
         ↓
Database Updated
         ↓
Socket.IO emit "send-location"
         ↓
Server broadcasts "receive-location"
         ↓
All Browsers Update Map Markers
```

### Multi-User Real-Time Update
```
User A Location Changes → Socket.emit → Server → broadcast → User B sees update
User B Location Changes → Socket.emit → Server → broadcast → User A sees update
User C Location Changes → Socket.emit → Server → broadcast → Users A & B see update
```

---

## Error Codes

### Authentication Errors

| Code | Message | Cause |
|------|---------|-------|
| 400 | Invalid email format | Email validation failed |
| 400 | User already exists | Email already registered |
| 401 | Invalid credentials | Wrong password |
| 401 | Invalid OTP | Wrong OTP code |
| 401 | JWT verification failed | Token expired or invalid |
| 404 | User not found | No account with email |

### Validation Errors

| Code | Message | Cause |
|------|---------|-------|
| 400 | Invalid coordinate format | Latitude/longitude not numbers |
| 400 | Latitude must be -90 to 90 | Out of valid range |
| 400 | Longitude must be -180 to 180 | Out of valid range |
| 400 | Missing required fields | Required param missing |

### Server Errors

| Code | Message | Cause |
|------|---------|-------|
| 500 | Server error while updating location | Database error |
| 500 | Email service error | SMTP not working |
| 503 | Database unavailable | MongoDB down |

---

## Code Examples

### Frontend: Send Location Every 5 Seconds

```javascript
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

setInterval(function() {
  // Get current position from geolocation
  navigator.geolocation.watchPosition(
    function(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      // Send to backend via REST API
      fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude,
          longitude,
          accuracy
        })
      });
      
      // Broadcast via Socket.IO
      socket.emit('send-location', {
        userId: userData.userId,
        username: userData.username,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date()
      });
    },
    function(error) {
      console.error('GPS Error:', error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}, LOCATION_UPDATE_INTERVAL);
```

### Frontend: Listen for Location Updates

```javascript
socket.on('receive-location', function(data) {
  console.log('Location from', data.username, ':', data.latitude, data.longitude);
  
  // Add or update marker on map
  if (userMarkers[data.userId]) {
    // Update existing marker
    userMarkers[data.userId].setLatLng([data.latitude, data.longitude]);
  } else {
    // Create new marker
    userMarkers[data.userId] = L.marker([data.latitude, data.longitude])
      .bindPopup(data.username)
      .addTo(map);
  }
});
```

### Backend: Handle Location Broadcast

```javascript
io.on('connection', function(socket) {
  socket.on('send-location', function(data) {
    console.log('Location from', data.userId);
    
    // Broadcast to ALL connected clients
    io.emit('receive-location', {
      userId: data.userId,
      username: data.username,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      timestamp: new Date()
    });
  });
});
```

### Frontend: Get All Active Users

```javascript
async function loadAllActiveUsers() {
  try {
    const response = await fetch('/api/location/active');
    const result = await response.json();
    
    if (result.success) {
      result.activeUsers.forEach(user => {
        addOrUpdateUserMarker(user);
      });
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}
```

---

**Last Updated**: May 2026 | **Version**: 2.0 | **Status**: ✅ Complete
