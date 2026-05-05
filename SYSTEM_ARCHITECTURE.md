# Leaflet Map System Architecture

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER A (Browser Window 1)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Login Page                                                    │
│     └─> Credentials Sent ──────────────────────┐                │
│                                                 │                │
│  2. Home Page Loads                             │                │
│     ├─ Leaflet Map Initializes (San Francisco) │                │
│     ├─ Geolocation Starts (Every 5s)          │                │
│     ├─ Friends List Loads                      │                │
│     └─ Socket.IO Connects                      │                │
│                                                 │                │
│  3. User A's Location Tracking                 │                │
│     └─ navigator.geolocation.getCurrentPosition()               │
│        └─ POST /api/location/update             │                │
│           ├─ Saves to MongoDB                  │                │
│           └─ Broadcasts via Socket.IO ────────┼──> User B      │
│                                                 │                │
│  4. User A Clicks Friend (User B) ◄────────────┤                │
│     ├─ selectUser(userId) Triggered            │                │
│     └─ GET /api/location/user/{userId} ────────┼──┐             │
│        ├─ Loading Spinner Shows                │  │             │
│        ├─ Backend Returns Location ────────────┼──┼─> Response: │
│        │  { latitude, longitude, email, ... }  │  │  40.7128,   │
│        │                                        │  │  -74.0060   │
│        └─ viewUserLocationOnMap(data) ◄────────┼──┘             │
│           ├─ Map Pan: leafletMap.setView()     │                │
│           ├─ Marker: L.marker([lat,lng])       │                │
│           ├─ Popup: marker.bindPopup()         │                │
│           └─ Display: marker.openPopup()       │                │
│                                                 │                │
│  5. Map Shows User B's Location                 │                │
│     ├─ User A sees marker on map               │                │
│     ├─ Popup shows: Name, Email, Coordinates  │                │
│     └─ Real-time updates if User B moves ◄────┼──┐             │
│                                                 │  │             │
│                                    Socket.IO   │  │             │
│                                    Events      │  │             │
│                                                 │  │             │
└─────────────────────────────────────────────────┼──┘─────────────┘
                                                  │
                                                  │
                          ┌───────────────────────┴──────────────┐
                          │                                      │
                      Express Server                    ┌──────────────────┐
                      MongoDB Database                  │  Socket.IO Server  │
                                                        └──────────────────┘
                          │                                      │
        ┌─────────────────┴──────────────────────────┬───────────┘
        │                                            │
        │  POST /api/location/update                 │
        │  GET  /api/location/users                  │  Real-time Broadcasts
        │  GET  /api/location/user/:userId ◄────────┘  • send-location
        │  POST /api/location/toggle-sharing            • receive-location
        │  GET  /api/location/history/:userId           • user-joined
        │                                               • user-disconnected
        │
        ├─ MongoDB Collections:
        │  ├─ Users (email, fullName, userId, latitude, longitude, ...)
        │  └─ LocationHistory (userId, latitude, longitude, accuracy, createdAt)
        │
        └─ Location Data Flow:
           ├─ User A location → MongoDB
           ├─ User B location → MongoDB
           ├─ User A queries User B location → API
           └─ User A sees User B on map → Leaflet renders marker
```

---

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Leaflet Map Component                                  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  • leafletMap = L.map('map')                            │    │
│  │  • L.tileLayer(OpenStreetMap)                           │    │
│  │  • Markers: { userId: L.marker(...) }                   │    │
│  │  • Popups: { userId: popup with user info }            │    │
│  │  • Controls: Pan, Zoom, Fullscreen                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           △                                      │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────┐    │
│  │  Location Management Module                            │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Functions:                                            │    │
│  │  • startLocationTracking() - Every 5 seconds          │    │
│  │  • selectUser() - Click handler for friends          │    │
│  │  • viewUserLocationOnMap() - Display on map           │    │
│  │  • addOrUpdateMarkerOnMap() - Socket.io updates      │    │
│  │  • updateMyMarkerOnMap() - Own location marker        │    │
│  │  • removeUserMarkerFromMap() - Cleanup                │    │
│  └──────────────────────────────────────────────────────┘    │
│                           △                                      │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────┐    │
│  │  Data Management                                        │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  • currentUser: { id, userId, name, email }           │    │
│  │  • usersList: [{ id, fullName, latitude, ... }]       │    │
│  │  • selectedUserId: Currently viewing                   │    │
│  │  • markers: { userId: leaflet_marker_object }         │    │
│  │  • locationSharingEnabled: boolean                     │    │
│  └──────────────────────────────────────────────────────┘    │
│                           △                                      │
│                           │                                      │
│  ┌────────────────────────┴───────────────────────────────┐    │
│  │  API & Socket.IO Client                                │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  REST API Calls:                                       │    │
│  │  • POST /api/location/update (5s)                     │    │
│  │  • GET /api/location/users (on load)                  │    │
│  │  • GET /api/location/user/:id (on click)              │    │
│  │  • POST /api/location/toggle-sharing                  │    │
│  │                                                        │    │
│  │  Socket.IO Events:                                     │    │
│  │  • emit: 'send-location' (5s)                         │    │
│  │  • emit: 'user-join' (on connect)                     │    │
│  │  • listen: 'receive-location' (broadcasts)            │    │
│  │  • listen: 'user-joined' (new user)                   │    │
│  │  • listen: 'user-disconnected' (gone)                 │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes (/api/location/*)                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                           │   │
│  │  POST /update                                             │   │
│  │  ├─ Receive: { latitude, longitude, accuracy }           │   │
│  │  ├─ Validate: Range checks                               │   │
│  │  ├─ Save: User.findByIdAndUpdate()                       │   │
│  │  ├─ Log: LocationHistory.create()                        │   │
│  │  └─ Return: { success, location }                        │   │
│  │                                                           │   │
│  │  GET /users                                               │   │
│  │  ├─ Query: Find all verified users except self           │   │
│  │  ├─ Format: Add isOnline status                          │   │
│  │  └─ Return: { success, users: [{ ... }] }                │   │
│  │                                                           │   │
│  │  GET /user/:userId  ◄─── FIXED: NOW INCLUDES EMAIL       │   │
│  │  ├─ Query: Find user by ID                               │   │
│  │  ├─ Check: Has location & sharing enabled                │   │
│  │  ├─ Format: Include email, coordinates, status           │   │
│  │  └─ Return: { success, user: { ..., email, ... } }       │   │
│  │                                                           │   │
│  │  POST /toggle-sharing                                     │   │
│  │  ├─ Receive: { isEnabled }                               │   │
│  │  ├─ Update: User.isLocationSharing                       │   │
│  │  └─ Return: { success, isLocationSharing }               │   │
│  │                                                           │   │
│  │  GET /history/:userId                                     │   │
│  │  ├─ Query: LocationHistory.find()                        │   │
│  │  ├─ Sort: By createdAt descending                        │   │
│  │  └─ Return: { success, history: [...] }                  │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                       │
│  ┌──────────────────────┬─┴──────────────────────────┐           │
│  │                      │                            │           │
│  ▼                      ▼                            ▼           │
│  Authentication    Middleware             Socket.IO Server      │
│  (JWT Verify)      (verifyAuth)           • Broadcasting        │
│  • Token check     • Extract userId       • User joining        │
│  • User attach     • Authorization       • Location updates     │
│                                          • Disconnections       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                           │ MongoDB
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Database (MongoDB)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Users Collection:                                               │
│  {                                                               │
│    _id: ObjectId,                                               │
│    email: "user@example.com",                                   │
│    fullName: "User Name",                                       │
│    userId: "username",                                          │
│    latitude: 37.7749,                                           │
│    longitude: -122.4194,                                        │
│    locationLastUpdated: ISODate("2025-04-29T..."),             │
│    isLocationSharing: true,                                     │
│    isVerified: true,                                            │
│    ... other fields                                             │
│  }                                                               │
│                                                                   │
│  LocationHistory Collection:                                     │
│  {                                                               │
│    userId: ObjectId,        # Reference to Users._id            │
│    latitude: 37.7752,                                           │
│    longitude: -122.4195,                                        │
│    accuracy: 10.5,                                              │
│    createdAt: ISODate("2025-04-29T..."),                       │
│  }                                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: "User A Clicks User B"

```
┌────────────────────────────────────────────────────────────────────┐
│                    Step-by-Step Data Flow                           │
└────────────────────────────────────────────────────────────────────┘

1. USER INTERACTION
   ┌─────────────────────────┐
   │ Click: User B in sidebar │
   └────────────┬────────────┘
                │
                ▼
2. JAVASCRIPT HANDLER
   ┌─────────────────────────────────────────────┐
   │ selectUser(userId, username, fullName)      │
   │ • userId = "user_b_id"                      │
   │ • Highlight friend item                     │
   │ • Show loading spinner                      │
   └────────────┬────────────────────────────────┘
                │
                ▼ HTTP GET Request
3. API CALL
   ┌──────────────────────────────────────────────────┐
   │ GET /api/location/user/user_b_id                  │
   │ Headers: { Authorization: JWT_TOKEN }            │
   └────────────┬───────────────────────────────────────┘
                │
                ▼ Network
4. SERVER PROCESSING
   ┌──────────────────────────────────────────────────┐
   │ locationController.getUserLocation()              │
   │ • Extract userId from req.params                  │
   │ • User.findById(userId).select(...)               │
   │ • Check: isLocationSharing && coordinates exist   │
   │ • Format response object with email               │
   └────────────┬───────────────────────────────────────┘
                │
                ▼ HTTP Response
5. RESPONSE
   ┌──────────────────────────────────────────────────┐
   │ {                                                 │
   │   "success": true,                                │
   │   "user": {                                       │
   │     "id": "user_b_id",                           │
   │     "fullName": "User B",                        │
   │     "username": "user_b",                        │
   │     "email": "user_b@test.com",   ◄─ FIXED      │
   │     "latitude": 40.7128,                         │
   │     "longitude": -74.0060,                       │
   │     "locationLastUpdated": "...",               │
   │     "isOnline": true                             │
   │   }                                               │
   │ }                                                 │
   └────────────┬───────────────────────────────────────┘
                │
                ▼ JSON Parsing
6. FRONTEND RECEIVES
   ┌──────────────────────────────────────────────────┐
   │ data = { success: true, user: {...} }             │
   │ • Check: data.success === true                    │
   │ • Extract: user object with all fields            │
   └────────────┬───────────────────────────────────────┘
                │
                ▼
7. DISPLAY ON MAP
   ┌──────────────────────────────────────────────────┐
   │ viewUserLocationOnMap(user)                       │
   │ • latlng = [40.7128, -74.0060]                    │
   │ • leafletMap.setView(latlng, 15)  ◄─ PAN MAP     │
   │ • marker = L.marker(latlng)       ◄─ CREATE      │
   │ • popup = `${user.fullName}`                      │
   │          + `${user.email}`                        │
   │          + `${user.latitude.toFixed(6)}`          │
   │ • marker.bindPopup(popup)         ◄─ ATTACH      │
   │ • marker.openPopup()              ◄─ SHOW        │
   │ • markers[user.id] = marker       ◄─ STORE       │
   └────────────┬───────────────────────────────────────┘
                │
                ▼
8. FINAL RESULT
   ┌──────────────────────────────────────────────────┐
   │ Map View:                                         │
   │ ┌──────────────────────────────────────────────┐ │
   │ │  OpenStreetMap (Leaflet)                     │ │
   │ │                                              │ │
   │ │         New York Area                        │ │
   │ │              📍 ◄─── Marker                   │ │
   │ │           ┌──────────┐                        │ │
   │ │           │ User B   │                        │ │
   │ │           │ email@.. │ ◄─ Popup               │ │
   │ │           │ 40.71°   │                        │ │
   │ │           │ -74.00°  │                        │ │
   │ │           │ Online ✓ │                        │ │
   │ │           └──────────┘                        │ │
   │ │                                              │ │
   │ │  [Zoom] [Pan] [Full Screen]                  │ │
   │ └──────────────────────────────────────────────┘ │
   │                                                   │
   │ Sidebar:                                          │
   │ • User B item is ACTIVE (highlighted)            │
   │ • Loading spinner is HIDDEN                      │
   │ • Success message shown: "Viewing location..."   │
   └──────────────────────────────────────────────────┘

```

---

## Technology Stack Comparison

### Before (Google Maps)
```
┌─────────────────┐
│  Google Maps API │  ← Requires API Key
│  (Paid Service)  │  ← Complex setup
│                  │  ← Dependencies
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Markers  │
    │ InfoWin  │
    │ Controls │
    └──────────┘
```

### After (Leaflet)
```
┌──────────────────┐
│   Leaflet.js     │  ← No API Key
│   (Open Source)  │  ← Simple setup
│  +OpenStreetMap  │  ← Free tiles
└────────┬─────────┘
         │
    ┌────▼──────────────────┐
    │ L.map()               │
    │ L.marker()            │
    │ L.tileLayer()         │
    │ L.popup()             │
    │ L.circle()            │
    │ Full control          │
    └───────────────────────┘
```

---

## Summary

The system now uses **Leaflet + OpenStreetMap** for a lightweight, free, and powerful location mapping solution. Users can click on friends to instantly view their location on the map with full details (name, email, coordinates, online status).

**Key Benefits:**
- ✅ No API keys required
- ✅ No monthly costs
- ✅ Better performance
- ✅ Open source & customizable
- ✅ Real-time updates via Socket.io
- ✅ Works on all devices

