# 🗺️ Google Maps API Setup Guide

## Overview

The GeoTrack application uses Google Maps JavaScript API to display user locations on an interactive map. This guide walks you through setting up the API key and enabling required permissions.

## Issues and Solutions

### ❌ Issue 1: "This page didn't load Google Maps correctly"

**Cause:** Invalid or missing Google Maps API key

**Solution:** 

1. **Get a Free Google Maps API Key:**
   - Go to: https://console.cloud.google.com
   - Click "Create Project" (if you don't have one)
   - Give it a name like "GeoTrack"
   - Click "Create"

2. **Enable Maps JavaScript API:**
   - In Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click on it and press "Enable"
   - Wait for it to activate (takes ~30 seconds)

3. **Create API Key:**
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

4. **Enable Billing (Required):**
   - Go to "Billing" (left sidebar)
   - Set up a billing account
   - **Note:** You get $200/month free credit. GeoTrack uses minimal API calls for personal use.

5. **Restrict Key (Optional but Recommended):**
   - In Credentials, click your API key
   - Under "API restrictions", select "Maps JavaScript API"
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain: `localhost:3000/*` or your production URL

### ✅ Fix: Configure the API Key in GeoTrack

**File:** `views/home.ejs` (Line 10)

**Current (Invalid):**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&loading=async&callback=onGoogleMapsLoaded" async defer></script>
```

**What to Do:**

Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&libraries=places&loading=async&callback=onGoogleMapsLoaded" async defer></script>
```

**Example (with real key):**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDDyWF-G-E3NgJrvsekqDkAkqfhuPlzQmQ&libraries=places&loading=async&callback=onGoogleMapsLoaded" async defer></script>
```

### ❌ Issue 2: "Location permission denied. Please enable geolocation in browser settings and reload."

**Cause:** Browser geolocation permission not granted

**Solution:**

#### For Chrome/Edge:
1. Click the **🔒 Lock icon** in the address bar (left of URL)
2. Find "Location" or "Site Settings"
3. Change from "Block" to "Allow"
4. Reload the page (Ctrl+R or Cmd+R)

#### For Firefox:
1. Click the **ℹ️ Info icon** in the address bar
2. Find "Permissions"
3. Change "Location" from "Block" to "Allow"
4. Reload the page

#### For Safari:
1. Go to **Safari → Preferences → Privacy**
2. Find "Location Services"
3. Select your site and change to "Allow"
4. Reload the page

### ⚠️ Issue 3: "Google Maps JavaScript API has been loaded directly without loading=async"

**Cause:** Suboptimal API loading configuration

**Status:** ✅ FIXED
- Added `loading=async` and `callback=onGoogleMapsLoaded` parameters
- This is now handled automatically

---

## Step-by-Step Testing

### Step 1: Configure API Key (5 minutes)

1. Get API key from https://console.cloud.google.com
2. Open `views/home.ejs`
3. Find line 10 with the Google Maps script tag
4. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your key
5. Save the file

### Step 2: Test Google Maps Loading

1. Reload the browser page (Ctrl+R)
2. **Expected:** Map appears without "Oops! Something went wrong" message
3. **Console:** Should show "✅ Google Maps initialized successfully"

### Step 3: Enable Browser Geolocation

1. Click the **🔒 Lock icon** in address bar
2. Allow location access
3. Reload the page (Ctrl+R)
4. **Expected:** "Location permission denied" message disappears
5. **Console:** Should show "✅ Got current position: {latitude, longitude, accuracy}"

### Step 4: Test Location Tracking

1. Wait 5 seconds after allowing geolocation
2. **Expected:** Your location appears on the map as a green marker 🟢
3. **Console:** Shows "📍 Updating location for user: [userId]"

### Step 5: Test Friend Location Viewing

1. Create second test account (see QUICK_START.md)
2. Login as first user (Alice)
3. Click on second user (Bob) in Friends list
4. **Expected:** Map shows Bob's location with a blue marker 🔵
5. **Expected:** Info window shows Bob's details, coordinates, and online status

---

## Complete Setup Code Reference

### Required Environment Variables

Create a `.env` file (optional - for production):

```env
GOOGLE_MAPS_API_KEY=your_key_here
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
```

### Configuration in app.js (if using env variables)

```javascript
// In your app.js or layout template
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
```

Then use it in the template:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=<%= googleMapsApiKey %>&libraries=places&loading=async&callback=onGoogleMapsLoaded" async defer></script>
```

---

## Troubleshooting

### Map shows "Oops! Something went wrong"

**Check:**
1. API key is valid (test on https://console.cloud.google.com)
2. Maps JavaScript API is enabled (not just installed)
3. Billing is set up and active
4. API key has no HTTP referrer restrictions (or includes localhost:3000)
5. Browser console for specific error:
   - `InvalidKeyMapError` = Invalid/wrong key
   - `BillingNotEnabledMapError` = Billing not set up
   - `ApiNotActivatedMapError` = API not enabled

### Geolocation always says "permission denied"

**Check:**
1. Browser permissions are set to "Allow"
2. Your device has GPS/Wi-Fi enabled
3. You're not in a private browsing window (some browsers block it)
4. Try in a different browser
5. Check browser console for error details

### Map loads but shows wrong location (San Francisco default)

**Check:**
1. Geolocation permission is granted
2. Wait 5+ seconds after allowing geolocation
3. Your device has GPS or Wi-Fi signal
4. Server console shows: `📍 Updating location for user: [userId]`

### Can see my location but friend's location shows "not available"

**Check:**
1. Friend has location sharing enabled (toggle must be ON)
2. Friend's geolocation permission is granted
3. Friend has waited 5+ seconds after allowing geolocation
4. Both users are online (green status in friends list)
5. Database has location data for friend

---

## Browser Support

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome  | ✅ Full | Recommended |
| Firefox | ✅ Full | Works well |
| Safari  | ✅ Full | Requires permission in Preferences |
| Edge    | ✅ Full | Works like Chrome |
| IE 11   | ❌ No  | Not supported (too old) |

---

## API Key Security Best Practices

### ❌ Never Do This:
- Share your API key in public
- Commit API key to GitHub/public repository
- Post it in forums or documentation

### ✅ Do This Instead:
- Use environment variables (.env file)
- Use API key restrictions (HTTP referrer)
- Restrict to Maps JavaScript API only
- Use separate keys for development and production
- Rotate keys periodically

### Production Deployment:

1. **Use environment variables:**
```javascript
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
```

2. **In your hosting platform (Heroku, AWS, etc.):**
```
Set environment variable: GOOGLE_MAPS_API_KEY = your_key
```

3. **Restrict API key to your domain:**
- Only allow requests from: `yourdomain.com`
- This prevents key theft or misuse

---

## Testing with Sample Data

Once Google Maps is working, test with these coordinates:

**San Francisco:**
- Latitude: 37.7749
- Longitude: -122.4194

**New York:**
- Latitude: 40.7128
- Longitude: -74.0060

**London:**
- Latitude: 51.5074
- Longitude: -0.1278

Manually insert these in database to test without GPS:

```javascript
// In MongoDB (mongo shell):
db.users.updateOne(
  { email: 'test@example.com' },
  { $set: {
    latitude: 37.7749,
    longitude: -122.4194,
    locationLastUpdated: new Date()
  }}
)
```

---

## Support & Documentation

- **Google Maps JavaScript API Docs:** https://developers.google.com/maps/documentation/javascript
- **Error Messages Help:** https://developers.google.com/maps/documentation/javascript/error-messages
- **Geolocation API Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- **Get API Key:** https://console.cloud.google.com

---

## Summary Checklist

- [ ] Created Google Cloud Project
- [ ] Enabled Maps JavaScript API
- [ ] Created API Key
- [ ] Set up Billing
- [ ] Configured API Key in `views/home.ejs` line 10
- [ ] Tested map loads without errors
- [ ] Allowed browser geolocation permission
- [ ] Verified own location shows on map
- [ ] Tested viewing friend's location
- [ ] Verified real-time location updates

---

**Last Updated:** 2026-04-29  
**Status:** ✅ Complete & Ready for Testing
