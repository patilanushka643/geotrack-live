# 🎬 Demo Mode - Quick Start

## 1. Open GeoTrack
```
http://localhost:3000/home
```

## 2. Open Browser Console
Press **F12** (or Ctrl+Shift+I on Windows, Cmd+Option+I on Mac)

## 3. Enable Demo Mode
Paste this in the console:
```javascript
demoMode.enable()
```

## 4. Watch the Map
- 4 users appear with colored markers
- Users move every 3-5 seconds
- Console shows real-time position updates

## 5. Commands

| Command | Purpose |
|---------|---------|
| `demoMode.enable()` | Start demo |
| `demoMode.disable()` | Stop demo |
| `demoMode.status()` | Show current status |
| `demoMode.isRunning()` | Check if running |
| `demoMode.debug()` | Show debug info |
| `demoMode.getUsers()` | Get all users |
| `demoMode.moveUser('user1')` | Move one user |

## Demo Users

| User | City | Location |
|------|------|----------|
| Demo User One | Delhi | 28.6139°N, 77.2090°E |
| Demo User Two | Mumbai | 19.0760°N, 72.8777°E |
| Demo User Three | Bangalore | 12.9716°N, 77.5946°E |
| Demo User Four | Hyderabad | 17.3850°N, 78.4867°E |

## What You'll See

```
✅ Demo Mode ENABLED
   • 4 colored markers on map
   • Markers moving every 3-5 seconds
   • Console shows: "📍 Simulated user update → user1, lat: X, lng: Y"
   • User info on marker click
```

## Key Features

✅ No login required  
✅ Real-time movement  
✅ Multiple users on map  
✅ 100% isolated - doesn't affect real users  
✅ ON/OFF in seconds  

## When Done

```javascript
demoMode.disable()
```

---

**See DEMO_MODE_GUIDE.md for complete documentation**
