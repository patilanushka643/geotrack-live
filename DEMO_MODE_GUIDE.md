# 🎬 Demo Mode - Visual Multi-User Simulator

## Overview

Demo Mode is a **completely isolated testing feature** that simulates multiple users and their live locations on your Leaflet map in real-time. No manual login from multiple devices needed!

**Perfect for**:
- ✅ Visual testing and verification
- ✅ Demonstrations and presentations
- ✅ UI/UX validation
- ✅ Performance testing with multiple users
- ✅ Debugging multi-user features

---

## Quick Start (30 Seconds)

### 1. Open your GeoTrack application
```
http://localhost:3000/home
```

### 2. Open Browser Developer Console
- **Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
- **Mac**: Press `Cmd + Option + I`

### 3. Enable Demo Mode
Type in the console:
```javascript
demoMode.enable()
```

### 4. Watch the Map
See 4 virtual users appear and move in real-time on your Leaflet map!

### 5. Disable When Done
```javascript
demoMode.disable()
```

---

## Features

### 🌍 Virtual Users (Out of the Box)

Four pre-configured demo users representing Indian cities:

| User | City | Starting Coordinates |
|------|------|----------------------|
| **Demo User One** | Delhi | 28.6139°N, 77.2090°E |
| **Demo User Two** | Mumbai | 19.0760°N, 72.8777°E |
| **Demo User Three** | Bangalore | 12.9716°N, 77.5946°E |
| **Demo User Four** | Hyderabad | 17.3850°N, 78.4867°E |

### 📍 Real-Time Movement

- Users move every **3-5 seconds** (randomized)
- Movement is **realistic**: ±0.005° (≈ 500 meters)
- Accuracy varies: 5-25 meters (simulating GPS accuracy)
- Map updates **automatically** without page refresh

### 🗺️ Map Integration

- ✅ Markers created for all users
- ✅ Markers update position (not recreated)
- ✅ Uses existing Leaflet map system
- ✅ Popup info on marker click
- ✅ Color-coded by user (visual distinction)

### 🔒 Complete Isolation

- **Zero impact on production code**
- **Does NOT affect real users**
- **Can be toggled ON/OFF instantly**
- **No modifications to core system**

---

## Command Reference

### Enable Demo Mode
```javascript
demoMode.enable()
```
**Output**: Initializes 4 virtual users and starts movement simulation

### Disable Demo Mode
```javascript
demoMode.disable()
```
**Output**: Stops all movement, removes demo markers from map

### Check Status
```javascript
demoMode.isRunning()
```
**Returns**: `true` if enabled, `false` if disabled

### Show Full Status
```javascript
demoMode.status()
```
**Output**: Displays all active users, their locations, and movement timers

### Show Debug Info
```javascript
demoMode.debug()
```
**Output**: System info (Socket.IO, Map, Global objects)

### Get All Demo Users
```javascript
demoMode.getUsers()
```
**Returns**: JavaScript object with all demo user data

### Move Specific User
```javascript
demoMode.moveUser('user1')  // or 'user2', 'user3', 'user4'
```
**Output**: Moves the specified user once (does not auto-continue)

### Add Custom User
```javascript
demoMode.addUser('custom-user', {
    username: 'CustomUser',
    fullName: 'My Custom User',
    email: 'custom@test.com',
    latitude: 28.6139,
    longitude: 77.2090,
    city: 'Test City'
})
```

---

## What You'll See

### Console Output (When Enabling)

```
🎬 Enabling Demo Mode...

🎬 ═══════════════════════════════════════════════
   DEMO MODE - INITIALIZING VIRTUAL USERS
═══════════════════════════════════════════════

   ✅ Demo User One (Delhi)
      └─ Start: [28.6139, 77.2090]
   ✅ Demo User Two (Mumbai)
      └─ Start: [19.0760, 72.8777]
   ✅ Demo User Three (Bangalore)
      └─ Start: [12.9716, 77.5946]
   ✅ Demo User Four (Hyderabad)
      └─ Start: [17.3850, 78.4867]

   Total demo users: 4
═══════════════════════════════════════════════

🎬 Starting demo simulation...

✅ Demo simulation started
   Running 4 movement timers

✅ Demo Mode ENABLED
   • Use demoMode.disable() to stop
   • Use demoMode.status() to check status
   • Use demoMode.debug() for debug info
```

### Map Visualization

- **4 colored markers** appear on the Leaflet map
- Each marker corresponds to a virtual user
- Markers **move smoothly** every 3-5 seconds
- **Click a marker** to see user info popup

### Real-Time Logs

As users move, you'll see:
```
📍 Simulated user update → user1, lat: 28.6142, lng: 77.2091
📍 Simulated user update → user2, lat: 19.0759, lng: 72.8779
📍 Simulated user update → user3, lat: 12.9714, lng: 77.5948
📍 Simulated user update → user4, lat: 17.3852, lng: 78.4866
```

---

## How It Works

### System Architecture

```
┌─────────────────────────────────────────────┐
│          DEMO MODE (Isolated)               │
│                                             │
│  1. Virtual Users Generated                 │
│  2. Movement Simulated (3-5 sec intervals)  │
│  3. Socket.IO Events Emitted                │
│         ↓                                   │
└─────────┬───────────────────────────────────┘
          │
          ├→ Existing Socket Listeners
          │  (socket.on("receive-location"))
          │         ↓
          ├→ addOrUpdateUserMarker()
          │         ↓
          ├→ userMarkers[] object updated
          │         ↓
          └→ Leaflet Map Redraws
```

### No Modifications to Production Code

Demo Mode **only**:
- ✅ Emits Socket.IO events
- ✅ Calls existing map update functions
- ✅ Does NOT modify core logic
- ✅ Does NOT store data in database
- ✅ Does NOT affect real users

---

## Practical Use Cases

### Use Case 1: Quick Visual Verification
```javascript
// Enable demo
demoMode.enable()

// Watch markers move for 30 seconds
// Disable when satisfied
demoMode.disable()
```

### Use Case 2: Performance Testing
```javascript
// Enable demo with multiple users
demoMode.enable()

// Monitor browser performance (DevTools → Performance tab)
// Check for lag, memory leaks, etc.

// Disable and analyze results
demoMode.disable()
```

### Use Case 3: Client Demonstration
```javascript
// Open app in full-screen
demoMode.enable()

// Show map with multiple users moving in real-time
// No need for actual users on multiple devices

demoMode.disable()  // when done
```

### Use Case 4: Debugging Issues
```javascript
// Check if map updates work correctly
demoMode.enable()

// Look at console logs
demoMode.debug()

// Verify Socket.IO is connected, map is initialized, etc.
```

---

## Important Notes

### ⚠️ Testing Only
- This feature is **for testing and development only**
- **Do NOT enable on production servers** (though it won't affect real users)
- **Disable before deploying to production**

### 🔒 Safety Guarantees
- ✅ Real users are **never affected**
- ✅ Database is **never modified**
- ✅ Production code is **never changed**
- ✅ Demo data **never persists**

### 🔌 Requirements
- Map must be initialized (`map` object must exist)
- Socket.IO must be connected (`socket.connected === true`)
- Leaflet must be loaded
- Console access (browser DevTools)

---

## Troubleshooting

### "demoMode is not defined"
```javascript
// Solution: Ensure demo-mode.js is loaded
// Check: <script src="/js/demo-mode.js"></script> in HTML
// Refresh the page
```

### Demo users not appearing on map
```javascript
// Check 1: Is map initialized?
typeof map !== 'undefined' && map !== null

// Check 2: Is Socket.IO connected?
socket.connected

// Check 3: Check debug info
demoMode.debug()
```

### Demo users not moving
```javascript
// Check: Is demo mode running?
demoMode.isRunning()  // Should return true

// Check: Status
demoMode.status()

// Re-enable if needed
demoMode.disable()
demoMode.enable()
```

### High CPU usage when demo is running
```javascript
// This is expected with real-time updates
// Disable demo mode when not testing
demoMode.disable()
```

---

## Console Commands Quick Reference

```javascript
// ===== MAIN COMMANDS =====
demoMode.enable()         // Start demo
demoMode.disable()        // Stop demo
demoMode.isRunning()      // Check if enabled
demoMode.status()         // Show detailed status
demoMode.debug()          // Show debug info

// ===== ADVANCED COMMANDS =====
demoMode.getUsers()       // Get all demo users object
demoMode.moveUser('user1')  // Move specific user once
demoMode.addUser('id', {...})  // Add custom demo user

// ===== VIEW RESULTS =====
// Open DevTools Console (F12) to see:
// • Colorful logs with emojis
// • Real-time user movement logs
// • System status information
// • Debug details
```

---

## Advanced: Custom Demo Users

Add your own test users:

```javascript
demoMode.enable()

// Add custom user
demoMode.addUser('test-user-5', {
    username: 'TestUser5',
    fullName: 'Test User Five',
    email: 'test5@example.com',
    latitude: 15.2993,   // Somewhere in India
    longitude: 74.8243,  // Or any coordinates
    city: 'Goa'
})

// Custom user will also move automatically
```

---

## File Structure

```
/public/js/
├── script.js          ← Main location tracking
├── demo-mode.js       ← NEW: Demo mode simulator (100% isolated)
└── locationModule.js  ← Location helpers

/views/
└── home.ejs          ← Updated to load demo-mode.js
```

---

## FAQ

**Q: Will demo mode affect real users?**  
A: No. Demo mode is 100% isolated and only emits Socket.IO events that existing code already handles.

**Q: Does demo mode save to database?**  
A: No. It only triggers UI updates using existing functions.

**Q: Can I use demo mode with real users?**  
A: Yes. Real users and demo users coexist - both will show on the map.

**Q: How do I stop demo mode?**  
A: Run `demoMode.disable()` in the console. All markers are removed instantly.

**Q: What if I forget to disable demo mode?**  
A: It will keep running until you disable it. Simply close the browser tab or disable it manually.

**Q: Can I modify demo users?**  
A: Yes. Use `demoMode.addUser()` or manually edit the DEMO_LOCATIONS object.

---

## Summary

**Demo Mode is a powerful testing tool that**:
- ✅ Shows multiple users on map in real-time
- ✅ Requires zero setup (just enable in console)
- ✅ Completely isolated from production code
- ✅ Can be toggled ON/OFF instantly
- ✅ Provides detailed debugging information

**Perfect for**:
- Testing multi-user features
- Client demonstrations
- Performance validation
- UI/UX verification

---

**Last Updated**: May 4, 2026  
**Demo Mode Version**: 1.0 - Multi-User Visual Simulator
