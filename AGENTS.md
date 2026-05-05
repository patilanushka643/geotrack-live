# GeoTrack Development Guide for AI Agents

**GeoTrack** is a real-time location tracking application with friend management, Email OTP authentication, and live multi-user location sharing via Socket.io and Leaflet maps.

## Quick Start

```bash
# Install dependencies
npm install

# Start server (default port 3000)
npm start

# Development with auto-reload
npm run dev  # Requires nodemon (installed)
```

**Main entry point**: [app.js](app.js)

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.io (default namespace)
- **Frontend**: EJS templates + vanilla JavaScript
- **Maps**: Leaflet with OpenStreetMap (no API key required!)
- **Authentication**: JWT (7-day expiry, stored in `authToken` cookie)
- **Email/OTP**: Nodemailer + bcryptjs for hashing

## Project Structure

```
app.js                          # Server entry, Socket.io setup
config/db.js                    # MongoDB connection
middleware/authMiddleware.js    # JWT verification, login checks
models/                         # MongoDB schemas: User, LocationHistory, Friendship
controllers/                    # Business logic for auth, location, friends
routes/                         # API endpoints: /api/auth/*, /location/*, /friends/*
views/                          # EJS templates (home, login, signup, etc.)
public/js/script.js             # Frontend: location tracking, map, Socket.io listeners
public/css/style.css            # Styling
utils/                          # Email and OTP helpers
```

## Architecture & Key Files

### Authentication System
**See**: [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md)

- **Flow**: Send OTP → Verify OTP → Register → Login with JWT
- **Middleware**: [authMiddleware.js](middleware/authMiddleware.js)
  - `verifyAuth`: Check JWT token, attach decoded user to `req.user`
  - `checkAlreadyLoggedIn`: Redirect authenticated users away from login pages
- **Critical Detail**: JWT token field `userId` contains MongoDB `_id` (not username)

### Location Tracking System
**See**: [LOCATION_PERMISSION_README.md](LOCATION_PERMISSION_README.md)

- **Real-time Flow**: 
  1. User logs in → location tracking starts automatically
  2. Browser requests geolocation permission (shows popup on first run)
  3. Every 5 seconds: GPS position → POST `/api/location/update` + Socket.io broadcast
  4. All users receive location updates via `receive-location` event
  5. Leaflet map displays markers color-coded by user
- **Key Functions**: [public/js/script.js](public/js/script.js)
  - `checkLocationPermission()`: Handles permission popup and auto-start
  - `startLocationTracking()`: Initiates GPS watchPosition
  - `sendLocationUpdate()`: Throttled to 5 seconds
  - `initializeMap()`: Leaflet setup with OpenStreetMap tiles
- **Status Indicators**: 🟢 Online (<60s), 🟡 Stale (>5min), 🔴 Offline

### Friend Management System
**See**: [FRIEND_LIST_QUICK_REFERENCE.md](FRIEND_LIST_QUICK_REFERENCE.md)

- **Features**: Send requests, accept/reject, view friend locations, multi-select friends
- **Model**: [models/Friendship.js](models/Friendship.js)
- **Controller**: [controllers/friendController.js](controllers/friendController.js)
- **Routes**: [routes/friendRoutes.js](routes/friendRoutes.js)
- **Endpoints**: 
  - POST `/api/friends/send-request` - Send friend request
  - POST `/api/friends/respond` - Accept/reject request
  - GET `/api/friends/list` - User's friends list
  - DELETE `/api/friends/:friendId` - Remove friend

### Socket.io Events
All events use the default namespace. Key events:

| Event | Direction | Purpose |
|-------|-----------|---------|
| `user-join` | Client → Server | Register user for location sharing |
| `send-location` | Client → Server | Broadcast location (every 5 sec) |
| `receive-location` | Server → Client | Update map with latest location |
| `user-joined` | Server → Client | Notify when new user connects |
| `user-disconnected` | Server → Client | Cleanup on logout/disconnect |
| `heartbeat` | Client ↔ Server | Keep-alive ping every 30 sec |

## Important Conventions & Patterns

### Database & Queries
- **User Model**: Email is unique, lowercase, and trimmed. `friendList` is array of ObjectIds.
- **LocationHistory**: Always has `userId` reference, `latitude`, `longitude`, `accuracy`, and `createdAt`.
- **Timestamps**: Mongoose adds `createdAt`/`updatedAt` automatically on all schemas.

### Frontend Code
- **Global Scope**: `socket` (Socket.io instance) and `map` (Leaflet map) are global variables
- **Console Logs**: Prefixed with emoji for easy debugging (🚀, ✅, 📍, ❌, ⚠️, 🔐)
- **Map Markers**: Stored in `userMarkers` object: `userMarkers[userId] = leafletMarker`
- **Location Updates**: Throttled to 5-second intervals via `lastLocationUpdateTime` check

### API Response Patterns
- **Success**: `{ success: true, message: "...", data: {...} }`
- **Error**: `{ success: false, error: "...", code: "..." }`
- **Protected Routes**: All location and friend routes require `verifyAuth` middleware

## Critical Details & Pitfalls

⚠️ **JWT `userId` Field**: Contains MongoDB `_id`, NOT the username/userId string
- Use `req.user.userId` (the ObjectId) when querying database
- Use `req.user.userId` for Socket.io event data

⚠️ **Location Sharing Auto-Enable**: When a user updates location, `isLocationSharing` is automatically set to true
- Check `user.isLocationSharing` before displaying locations in UI

⚠️ **Online Status Calculation**: Based on last location update timestamp
- `< 60 seconds` = Online (🟢)
- `> 5 minutes` = Stale (🟡)
- `> 60 seconds` = Offline (🔴)

⚠️ **Geolocation Permission**: Required for location tracking
- First run shows browser popup (cannot be dismissed programmatically)
- If denied, map still works but no GPS tracking (show error message)
- Check `permissionCheckComplete` flag before starting tracking

⚠️ **Socket.io Connection**: Runs on default namespace (not custom)
- All emits broadcast to ALL connected users
- Implement server-side filtering for private messages if needed

## Environment Variables

Required in `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/geotrack
JWT_SECRET=your_secret_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=3000
NODE_ENV=development
```

See [ENV_CONFIGURATION.md](ENV_CONFIGURATION.md) for detailed setup.

## Common Development Tasks

### Adding a New Feature
1. **Model**: Create/update schema in `models/`
2. **Controller**: Add logic in `controllers/` (e.g., `friendController.js`)
3. **Routes**: Add endpoint in `routes/` (e.g., `friendRoutes.js`)
4. **Frontend**: Add HTML/CSS in `views/`, JavaScript in `public/js/script.js`
5. **Real-time**: Add Socket.io events in `app.js` if needed

### Debugging Location Issues
- Check `LOCATION_UPDATE_INTERVAL` (default 5000ms) and `GPS_CHECK_INTERVAL` (10000ms)
- Verify geolocation permission in browser settings
- Check `watchPositionId` is set (means tracking is active)
- Check Socket.io connection: `socket.connected` should be true

### Adding a New API Endpoint
1. Add route in appropriate `routes/*.js` file
2. Create controller function in corresponding `controllers/*.js`
3. Apply `verifyAuth` middleware if protected
4. Test with Socket.io broadcast if real-time feature needed
5. Document in route comments

### Database Queries
- Always use `req.user.userId` for authenticated user (it's the MongoDB `_id`)
- Use `.populate()` for friend references: `User.findById(userId).populate('friendList')`
- Check `isLocationSharing` before retrieving location data

## Useful Documentation

- [AUTHENTICATION_GUIDE.md](AUTHENTICATION_GUIDE.md) - OTP flow details
- [LOCATION_PERMISSION_README.md](LOCATION_PERMISSION_README.md) - GPS & permission handling
- [FRIEND_LIST_QUICK_REFERENCE.md](FRIEND_LIST_QUICK_REFERENCE.md) - Friend system reference
- [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) - Full setup instructions
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing strategies
- [TROUBLESHOOTING_AND_FAQ.md](TROUBLESHOOTING_AND_FAQ.md) - Common issues

## Notes for AI Agents

✅ **Do**: Check environment variables before running server  
✅ **Do**: Use Socket.io for real-time features (prefer over polling)  
✅ **Do**: Verify JWT token contains `userId` as MongoDB ObjectId  
✅ **Do**: Throttle location updates (5-second minimum interval)  
✅ **Do**: Handle geolocation permission errors gracefully  

❌ **Don't**: Modify Socket.io events without updating all listeners  
❌ **Don't**: Assume email is case-sensitive (it's normalized to lowercase)  
❌ **Don't**: Use custom Socket.io namespaces (breaks current system)  
❌ **Don't**: Store location data without accuracy metadata  
❌ **Don't**: Bypass `verifyAuth` middleware on protected routes  
