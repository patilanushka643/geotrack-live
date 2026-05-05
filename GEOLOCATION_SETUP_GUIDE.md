# 🔍 Geolocation Permissions Guide

## Overview

Geolocation is essential for GeoTrack to track your real-time location. Browsers require explicit permission to access location data.

## Understanding Geolocation

### How It Works:
1. **Request:** Application asks browser for your location
2. **Prompt:** Browser shows permission prompt
3. **Choice:** You allow or deny access
4. **Data:** If allowed, browser provides GPS coordinates from:
   - GPS hardware (phones, tablets)
   - Wi-Fi location database
   - IP address geolocation

### What GeoTrack Does:
- ✅ Gets your location every 5 seconds
- ✅ Sends it to server securely
- ✅ Shows it on map
- ✅ Never stores it longer than 24 hours by default
- ❌ Does NOT track you outside the app
- ❌ Does NOT share with third parties

---

## Browser-Specific Permission Instructions

### 🔵 Google Chrome

#### First Time:
1. You'll see a prompt: **"GeoTrack wants to know your location"**
2. Click **"Allow"** button
3. If you missed the prompt, look for **🔒 Lock icon** in address bar

#### To Change Permission Later:
1. Click **🔒 Lock icon** left of URL bar
2. Look for **"Location"** or click **"Site Settings"**
3. Click the dropdown next to Location
4. Change from **"Block"** to **"Allow"**
5. Reload page (Ctrl+R)

#### If Permission Icon is Hidden:
1. Click **⋮ Menu** (three dots, top-right)
2. Go to **Settings → Privacy and security → Site settings**
3. Click **"Location"**
4. Find `localhost:3000` or your domain
5. Change to **"Allow"**

---

### 🔴 Firefox

#### First Time:
1. You'll see a prompt at the top of the page
2. Click **"Allow"** button
3. Permission saved automatically

#### To Change Permission Later:
1. Click **ℹ️ Information icon** left of URL bar
2. Click **"Permissions"** section
3. Find **"Location"**
4. Change from **"Block"** to **"Allow"**
5. Reload page (Ctrl+R)

#### Alternative Method:
1. Click **☰ Menu** (three lines, top-right)
2. Go to **Settings → Privacy & Security**
3. Scroll to **"Permissions"**
4. Click **"Manage Exceptions"** next to Location
5. Find your domain and set to **"Allow"**

---

### 🍎 Safari (Mac & iOS)

#### Mac (macOS):
1. Go to **Safari → Settings → Privacy** (top menu bar)
2. Find **"Location Services"** section
3. Check box: **"Ask websites for permission"**
4. You'll see prompt on first access
5. Click **"Allow"**

#### If Already Blocked:
1. Go to **Safari → Settings → Privacy**
2. Find **"Allow Location Access for These Websites"**
3. Find your domain in the list
4. Change from **"Deny"** to **"Allow"** or **"Ask"**

#### iOS (iPhone/iPad):
1. Go to **Settings → Safari → Location**
2. Set to **"Ask"** (will prompt on each visit)
3. When prompt appears: tap **"Allow While Using App"**

---

### 🔶 Microsoft Edge

#### First Time:
1. You'll see prompt: **"Allow Edge to access your location?"**
2. Click **"Yes"** button

#### To Change Permission:
1. Click **⋮ Menu** (top-right)
2. Go to **Settings → Privacy, Search, and Services**
3. Scroll to **"Permissions"**
4. Click **"Manage"** next to Location
5. Toggle domain from **Off** to **On**

---

### 🟠 Opera

#### First Time:
1. You'll see permission prompt at top
2. Click **"Allow"** button

#### To Change Permission:
1. Click **⨯ Menu** (bottom-left or top-right)
2. Go to **Settings**
3. Click **"Websites"** tab
4. Find **"Permissions"**
5. Look for **"Location"**
6. Set your domain to **"Allowed"**

---

## Troubleshooting

### ❓ Prompt Never Appeared

**Solution:**
1. Check if permission was already granted/denied
2. Follow "To Change Permission Later" section for your browser
3. Make sure **"Allow"** is selected
4. Reload the page (Ctrl+R)

**If that doesn't work:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Close all browser tabs
3. Reopen the page fresh
4. Allow permission when prompted

### ❓ Permission Granted but Location Still Says "Not Available"

**Check these:**
1. **Wi-Fi is on** - Most common issue
2. **GPS is enabled** - On phones/tablets
3. **Not in private/incognito mode** - Some browsers block it
4. **Wait 5-10 seconds** - First location takes time
5. **Browser has internet** - Can't work offline

**Advanced checks:**
1. Test in a different browser
2. Check browser console (F12) for specific errors:
   - `PERMISSION_DENIED` = Need to allow in settings
   - `POSITION_UNAVAILABLE` = GPS/Wi-Fi not working
   - `TIMEOUT` = Taking too long, try again

### ❓ Getting Old Location Instead of Current Location

**Solutions:**
1. **Wait longer** - New location takes 5-10 seconds to get
2. **Move to new location** - Current position might be cached
3. **Disable "maximumAge"** - Prevents caching (already done in app)
4. **Restart device** - Sometimes GPS needs reset

### ❓ Location Jumps Around (Inaccurate)

**Causes and Solutions:**
1. **Wi-Fi inaccuracy** - Normal, can be ±100-500 meters
2. **Move to open area** - Trees/buildings block GPS
3. **Wait for GPS lock** - Takes 20-30 seconds for accuracy
4. **Check device settings** - Location services might be in "Wi-Fi only" mode

---

## Privacy & Security

### What Gets Stored?
```javascript
{
  userId: "your_id",           // Your unique ID
  latitude: 37.7749,           // Your coordinates
  longitude: -122.4194,
  accuracy: 10.5,              // ±10.5 meters
  locationLastUpdated: "2026-04-29T10:30:00Z",
  timestamp: "2026-04-29T10:30:00Z"
}
```

### Data Retention:
- ✅ Latest location: **Kept (always)**
- ✅ Location history: **30 days by default**
- ✅ Old history: **Auto-deleted**
- ✅ On logout: **Location data persists** (for friends to view)

### Who Can See?
- ✅ You: Always see your own location
- ✅ Your friends: Only if sharing is enabled
- ❌ Non-friends: Cannot see your location
- ❌ Server logs: Don't include coordinates

### Disable Location Sharing:
1. Click **📍 Share Location** toggle on left
2. Toggle OFF (red)
3. Friends will see "Location not available"
4. Your location still tracked but not shared

---

## Technical Details for Developers

### Geolocation API Options Used:

```javascript
{
  enableHighAccuracy: true,  // Use GPS if available (battery impact)
  timeout: 10000,            // Wait 10 seconds max
  maximumAge: 0              // Always get fresh location (no caching)
}
```

### Expected Accuracy:
- **GPS**: 5-10 meters (outdoor)
- **Wi-Fi**: 10-100 meters
- **IP-based**: 1-40 km (fallback only)

### Permissions Model:
- **Same-Origin Policy:** Only this domain can access your location
- **HTTPS Required:** In production (not localhost)
- **Per-domain:** Each website gets separate permission
- **Revocable:** Can change anytime in browser settings

---

## Testing Geolocation

### Simulate Different Locations (For Developers):

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to **Sensors** tab (⋯ → More Tools → Sensors)
3. Change **Location** dropdown from "No override" to specific locations
4. See app respond with those coordinates

**Firefox Developer Tools:**
1. Open DevTools (F12)
2. Go to **Inspector** → **Responsive Design Mode** (Ctrl+Shift+M)
3. Click **⋯ Menu** → **Settings**
4. Check "Simulate geolocation coordinates"
5. Enter latitude/longitude

---

## Accessibility

### For Accessibility Needs:
1. **Can't grant permission?** Contact app admin to manually set location
2. **Can't enable GPS?** Ask friends to "share" their location instead
3. **Accuracy issues?** Ensure device location services are updated

---

## FAQ

**Q: Does geolocation drain battery?**  
A: Yes, but GeoTrack only updates every 5 seconds (efficient). GPS drains more than Wi-Fi.

**Q: Is my location sent over secure connection?**  
A: Yes, all communication is encrypted (HTTPS/TLS).

**Q: Can someone spoof my location?**  
A: No, browser controls geolocation. Server trusts browser data.

**Q: What if I'm in a remote area?**  
A: App will say "location unavailable" if no GPS/Wi-Fi signal.

**Q: Can I fake my location?**  
A: No through the app, but browser extensions can (advanced users only).

**Q: Does app work without geolocation?**  
A: Yes, but you can't share your location. You can still view friends' locations.

---

## Summary

| Task | Steps | Time |
|------|-------|------|
| Allow geolocation | Click "Allow" on prompt | 5 seconds |
| Change permission | Click lock icon → Allow → Reload | 30 seconds |
| Disable sharing | Toggle OFF in app | 2 seconds |
| Troubleshoot | Follow section above | 2-5 minutes |

---

**Need Help?** Check the browser console (F12 → Console) for specific error messages.

**Last Updated:** 2026-04-29
