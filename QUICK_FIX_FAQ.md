# Quick Troubleshooting & FAQ

## Quick Fixes

### ❌ Problem: "Marker not appearing on map"

**Checklist:**
```javascript
// 1. Check if map exists
console.log(leafletMap);  // Should NOT be null

// 2. Check if coordinates are valid
console.log(typeof latitude);  // Should be 'number'
console.log(typeof longitude); // Should be 'number'
console.log(latitude >= -90 && latitude <= 90);  // Must be true
console.log(longitude >= -180 && longitude <= 180); // Must be true

// 3. Check if marker is added to map
console.log(markers);  // Should contain userId keys

// 4. Check database
// MongoDB: db.users.findOne({ userId: "user_b" }, { latitude: 1, longitude: 1 })
```

**Solutions:**
1. Verify user's location is saved in MongoDB
2. Ensure location sharing is enabled for that user
3. Check browser console for JavaScript errors
4. Try refreshing the page

---

### ❌ Problem: "API returns 404: User not found"

**Frontend Error:**
```
GET /api/location/user/user_id 404
Response: { success: false, message: "User not found" }
```

**Causes & Fixes:**
1. **Wrong user ID format**
   ```javascript
   // Check if using MongoDB ObjectId correctly
   console.log(selectedUserId);  // Should be MongoDB ObjectId string
   // Not username, but actual _id from database
   ```

2. **User doesn't exist**
   ```javascript
   // In MongoDB:
   db.users.findOne({ _id: ObjectId("actual_id") })  // Should exist
   ```

3. **User ID mismatch**
   ```javascript
   // Make sure selectUser() receives correct userId
   // Check friend-item onclick in home.ejs:
   onclick="selectUser('${user.id}', ...)"  // Using user.id (MongoDB _id)
   ```

---

### ❌ Problem: "Location not available or sharing disabled"

**Error Message:**
```
User location not available or sharing disabled
```

**Causes:**
1. **Location sharing disabled** → Toggle ON in sidebar
2. **No location data in DB** → Wait 5-10 seconds for first update
3. **Coordinates missing** → Check if latitude/longitude fields exist

**Quick Fix:**
```javascript
// In MongoDB:
db.users.updateOne(
    { userId: "user_b" },
    { $set: { 
        latitude: 40.7128, 
        longitude: -74.0060,
        isLocationSharing: true,
        locationLastUpdated: new Date()
    }}
)
```

---

### ❌ Problem: "Geolocation permission denied"

**Error:**
```
Error: Permission denied by user
```

**Solutions:**
1. **Browser settings:**
   - Chrome: Settings → Privacy & Security → Location → Allow
   - Firefox: Preferences → Privacy → Permissions → Allow location
   - Safari: Preferences → Privacy → Allow location access

2. **Clear site data & retry:**
   ```javascript
   // Clear localStorage
   localStorage.clear();
   // Reload page
   location.reload();
   ```

3. **Try in incognito/private window** (some browsers block by default)

4. **Ensure HTTPS** (or localhost for testing)

---

### ❌ Problem: "Socket.io not connecting"

**Check Connection:**
```javascript
console.log(socket.connected);  // true = connected, false = not connected
console.log(socket.id);         // Should show socket ID

// If not connected, check network tab
// Should see WebSocket upgrade in Network tab
```

**Solutions:**
1. **Check server is running:**
   ```bash
   npm start
   # Should show: Server running on port 3000
   ```

2. **Check Socket.io is served:**
   ```javascript
   // Should work in console:
   console.log(typeof io);  // Should be 'function'
   ```

3. **Check firewall/proxy:**
   - Some networks block WebSocket
   - Try different network or VPN

---

### ❌ Problem: "Multiple markers on map, only one shows"

**Cause:** Markers are overlapping, one is behind another

**Solutions:**
```javascript
// Pan to marker to see it
leafletMap.setView(markers['user_id'].getLatLng(), 15);

// Or zoom to show all markers:
const bounds = L.latLngBounds([]);
Object.values(markers).forEach(marker => {
    bounds.extend(marker.getLatLng());
});
leafletMap.fitBounds(bounds);

// Or use marker clustering (advanced):
// npm install leaflet.markercluster
```

---

## FAQ

### Q: Do I need a Google Maps API key?
**A:** No! The app now uses Leaflet with free OpenStreetMap tiles. No API keys required.

### Q: How often does location update?
**A:** Every 5 seconds by default. You can change this:
```javascript
// In home.ejs, find:
}, 5000);  // ← Change to 10000 (10 seconds) or any interval

// Or adjust in startLocationTracking():
locationUpdateInterval = setInterval(() => {
    getAndShareLocation();
}, 10000);  // Change here
```

### Q: Can I use custom marker icons?
**A:** Yes! Leaflet supports custom icons:
```javascript
const customIcon = L.icon({
    iconUrl: '/path/to/icon.png',
    iconSize: [25, 41],
    popupAnchor: [1, -34]
});

L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
```

### Q: How do I show different colors for different users?
**A:** Customize marker creation:
```javascript
function getMarkerIcon(userType) {
    const colors = {
        friend: '#3b82f6',      // Blue
        family: '#10b981',       // Green
        online: '#ef4444'        // Red
    };
    
    return L.icon({
        // HTML SVG icon with color
        className: `marker-${userType}`,
        // Or use colored images
    });
}
```

### Q: Can I track location history?
**A:** Yes! API endpoint exists:
```javascript
// GET /api/location/history/:userId?limit=50
fetch('/api/location/history/user_id')
    .then(r => r.json())
    .then(data => {
        console.log(data.history);  // Array of past locations
    });
```

### Q: How do I restrict location to friends only?
**A:** Uncomment code in locationController.js:
```javascript
// Around line 160, uncomment:
// const currentUser = await User.findById(currentUserId);
// if (!currentUser.friendList.includes(userId)) {
//   return res.status(403).json({
//     success: false,
//     message: "You are not friends with this user",
//   });
// }
```

### Q: Can I show location history on the map?
**A:** Yes, fetch history and draw polyline:
```javascript
// Get location history
fetch(`/api/location/history/${userId}`)
    .then(r => r.json())
    .then(data => {
        // Create polyline of past locations
        const latlngs = data.history.map(h => [h.latitude, h.longitude]);
        L.polyline(latlngs, { color: 'blue' }).addTo(leafletMap);
    });
```

### Q: How do I zoom to a specific user?
**A:** Use setView:
```javascript
// Zoom to User B's location
const marker = markers['user_b_id'];
leafletMap.setView(marker.getLatLng(), 15);  // zoom level 15

// Zoom to all markers:
const group = new L.featureGroup(Object.values(markers));
leafletMap.fitBounds(group.getBounds());
```

### Q: Can I add geofencing (alert when friend nearby)?
**A:** Yes, check distance:
```javascript
// Calculate distance between two points
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * 
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Check if friend is within 1 km
socket.on('receive-location', (data) => {
    const distance = getDistance(
        myLat, myLng, 
        data.latitude, data.longitude
    );
    if (distance < 1) {
        showAlert(`${data.username} is nearby!`, 'info');
    }
});
```

### Q: Why is map loading slowly?
**A:** Optimize:
```javascript
// 1. Increase location update interval
}, 30000);  // Update every 30 seconds instead of 5

// 2. Lazy load friends' markers
// Only add marker when friend is clicked, not on load

// 3. Debounce map updates
const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

const debouncedUpdate = debounce((user) => {
    viewUserLocationOnMap(user);
}, 200);
```

### Q: Can I export location data?
**A:** Yes, from API:
```javascript
// Get all user locations
fetch('/api/location/users')
    .then(r => r.json())
    .then(data => {
        // Convert to CSV
        const csv = data.users.map(u => 
            `${u.fullName},${u.latitude},${u.longitude}`
        ).join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'locations.csv';
        a.click();
    });
```

---

## Common Code Errors

### Error: "Cannot read property 'setView' of null"
**Cause:** `leafletMap` is null
**Solution:** Ensure `initializeMap()` is called before using map
```javascript
// In window.addEventListener('DOMContentLoaded'):
initializeMap();  // Must be first!
```

### Error: "markers is not defined"
**Cause:** `markers` variable not initialized
**Solution:** Check top of script section:
```javascript
let markers = {};  // Must exist at global scope
```

### Error: "L is not defined"
**Cause:** Leaflet library not loaded
**Solution:** Check CDN link in <head>:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
```

### Error: "selectedUserId is not a number"
**Cause:** Wrong parameter passed to selectUser()
**Solution:** Check onclick handler uses user.id (MongoDB ObjectId):
```javascript
// Correct:
onclick="selectUser('${user.id}', ...)"  // MongoDB _id

// Wrong:
onclick="selectUser('${user.username}', ...)"  // username
```

---

## Performance Tips

### 1. **Reduce location update frequency**
```javascript
// Change from 5s to 30s
locationUpdateInterval = setInterval(() => {
    getAndShareLocation();
}, 30000);  // 30 seconds
```

### 2. **Clear old markers**
```javascript
// Remove markers for offline users (no update > 5 min)
function clearOfflineMarkers() {
    Object.entries(markers).forEach(([userId, marker]) => {
        const user = usersList.find(u => u.id === userId);
        if (!user || !user.isOnline) {
            leafletMap.removeLayer(marker);
            delete markers[userId];
        }
    });
}

// Call periodically:
setInterval(clearOfflineMarkers, 60000);  // Every minute
```

### 3. **Lazy load markers**
```javascript
// Don't load all markers on page load
// Only load when user clicks friend:
async function selectUser(userId, username, fullName) {
    // Only create marker when clicked
    // Don't pre-create all markers
}
```

### 4. **Use marker clustering**
```javascript
// npm install leaflet.markercluster
// For 100+ users on map
const markerClusterGroup = L.markerClusterGroup();
Object.values(markers).forEach(marker => {
    markerClusterGroup.addLayer(marker);
});
leafletMap.addLayer(markerClusterGroup);
```

---

## Security Checklist

- ✅ All APIs require authentication (JWT)
- ✅ Users can toggle location sharing
- ✅ Geolocation data doesn't expose sensitive info
- ✅ API validates user permissions before returning data
- ✅ Database stores location data securely

**To Enable Friend-Only Access:**
```javascript
// Uncomment in locationController.js
const currentUser = await User.findById(currentUserId);
if (!currentUser.friendList.includes(userId)) {
    return res.status(403).json({
        success: false,
        message: "You are not friends with this user",
    });
}
```

---

## Version Info

| Component | Version |
|-----------|---------|
| Leaflet | 1.9.4 |
| OpenStreetMap | Latest |
| Node.js | 14+ |
| Express | 4.x |
| MongoDB | 4.x+ |
| Socket.io | 4.x |

---

## Support Resources

- **Leaflet Docs:** https://leafletjs.com/reference.html
- **OpenStreetMap:** https://www.openstreetmap.org/
- **Socket.io:** https://socket.io/docs/
- **Express:** https://expressjs.com/
- **MongoDB:** https://docs.mongodb.com/

---

## Still Need Help?

1. Check browser console (F12) for errors
2. Check Network tab for API responses
3. Check server logs for backend errors
4. Verify MongoDB connection
5. Review LEAFLET_TESTING_GUIDE.md for step-by-step tests
6. Check SYSTEM_ARCHITECTURE.md for flow diagrams

