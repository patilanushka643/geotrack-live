# ✅ Demo Mode - Testing Checklist

## Pre-Test Setup

- [ ] Server is running (`npm start` completed successfully)
- [ ] Browser can access `http://localhost:3000/home`
- [ ] You can login to GeoTrack or access the home page
- [ ] Leaflet map is visible on the page
- [ ] Browser DevTools are accessible (F12)

---

## Step 1: Enable Demo Mode

**Action**: Open browser console and run:
```javascript
demoMode.enable()
```

**Expected Output** ✅:
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
```

**Verification**:
- [ ] No errors in console
- [ ] All 4 demo users initialized
- [ ] Starting coordinates shown
- [ ] "Demo Mode ENABLED" message appears

---

## Step 2: Verify Map Updates

**Action**: Wait 5-10 seconds and observe the map

**Expected Observations** ✅:
- [ ] **4 colored markers** appear on the Leaflet map
  - Red marker (Delhi)
  - Teal marker (Mumbai)
  - Blue marker (Bangalore)
  - Orange marker (Hyderabad)
- [ ] Markers are scattered across the map (not overlapping)
- [ ] Zoom level is appropriate to see all markers
- [ ] Map is responsive and not frozen

---

## Step 3: Verify Movement

**Action**: Watch console for 15 seconds

**Expected Behavior** ✅:
Console should show recurring messages:
```
📍 Simulated user update → user1, lat: 28.6142, lng: 77.2091
📍 Simulated user update → user2, lat: 19.0758, lng: 72.8779
📍 Simulated user update → user3, lat: 12.9715, lng: 77.5948
📍 Simulated user update → user4, lat: 17.3851, lng: 78.4866
```

**Verification**:
- [ ] Messages appear every 3-5 seconds
- [ ] Latitude/longitude values change slightly each time
- [ ] All 4 users generate updates (not just some)
- [ ] No error messages in console
- [ ] Coordinates remain within expected ranges

---

## Step 4: Verify Map Marker Updates

**Action**: Watch the colored markers on the map

**Expected Behavior** ✅:
- [ ] Markers move smoothly every 3-5 seconds
- [ ] Movement is realistic (small jumps, not teleporting)
- [ ] Markers don't flicker or duplicate
- [ ] Markers stay within India (approximate)
- [ ] Marker colors remain consistent

---

## Step 5: Test Marker Popup

**Action**: Click on each marker on the map

**Expected Behavior** ✅:
For each marker click:
- [ ] A popup appears with user information
- [ ] Popup shows coordinates
- [ ] Popup shows timestamp
- [ ] Popup is readable and properly formatted
- [ ] Popup closes when you click elsewhere

**Example Popup**:
```
📍 Demo User One
Coordinates: 28.6142, 77.2091
Status: 🟢 Live
Time: 3:45:23 PM
```

---

## Step 6: Test Status Command

**Action**: In console, run:
```javascript
demoMode.status()
```

**Expected Output** ✅:
```
🎬 ═══════════════════════════════════════════════
   DEMO MODE STATUS
═══════════════════════════════════════════════

Status: ✅ ENABLED
Active Users: 4
Running Intervals: 4

Active Demo Users:
   • Demo User One (Delhi)
     └─ Current: [28.6142, 77.2091]
   • Demo User Two (Mumbai)
     └─ Current: [19.0758, 72.8779]
   • Demo User Three (Bangalore)
     └─ Current: [12.9715, 77.5948]
   • Demo User Four (Hyderabad)
     └─ Current: [17.3851, 78.4866]

═══════════════════════════════════════════════
```

**Verification**:
- [ ] Status shows "✅ ENABLED"
- [ ] All 4 users listed
- [ ] Current coordinates shown (different from initial)
- [ ] Running intervals = 4

---

## Step 7: Test Debug Command

**Action**: In console, run:
```javascript
demoMode.debug()
```

**Expected Output** ✅:
```
🔧 ═══════════════════════════════════════════════
   DEMO MODE - DEBUG INFO
═══════════════════════════════════════════════

Global Objects:
   • socket: ✅ Available
   • map: ✅ Available
   • userMarkers: ✅ Available
   • addOrUpdateUserMarker: ✅ Available

Socket Status:
   • Connected: ✅ Yes
   • ID: [socket-id-here]

Demo Users:
   • Total: 4
   • user1: ✅ Initialized
   • user2: ✅ Initialized
   • user3: ✅ Initialized
   • user4: ✅ Initialized

═══════════════════════════════════════════════
```

**Verification**:
- [ ] Socket is connected ✅
- [ ] Map is available ✅
- [ ] All 4 users initialized ✅
- [ ] No "❌" marks (errors)

---

## Step 8: Test Disable Command

**Action**: In console, run:
```javascript
demoMode.disable()
```

**Expected Behavior** ✅:
```
🎬 Disabling Demo Mode...

✅ Demo Mode DISABLED
   All markers removed from map
```

**Verification**:
- [ ] Console shows "Demo Mode DISABLED"
- [ ] All 4 markers disappear from map
- [ ] Movement updates stop (no more console logs)
- [ ] No errors during disable

---

## Step 9: Test Re-enable

**Action**: In console, run:
```javascript
demoMode.enable()
```

**Expected Behavior** ✅:
- [ ] Demo users initialize again
- [ ] 4 new markers appear on map
- [ ] Movement simulation resumes
- [ ] All features work as before

---

## Step 10: Verify Isolation

**Action**: Test that demo mode doesn't affect real users

**Checks**:
- [ ] Real location sharing still works normally
- [ ] Real users can still join/leave
- [ ] Database is not modified by demo
- [ ] Logout still works properly
- [ ] Login still works properly

**How to Verify**:
1. `demoMode.enable()` - Start demo
2. Try to enable location sharing (if not already)
3. Verify real location data is separate from demo
4. `demoMode.disable()` - Stop demo
5. Verify normal operation continues

---

## Step 11: Test Advanced Commands

### Get Users
**Action**: In console, run:
```javascript
demoMode.getUsers()
```
**Expected**: Returns JavaScript object with all 4 users ✅

### Move Specific User
**Action**: In console, run:
```javascript
demoMode.moveUser('user1')
```
**Expected**: User1 moves once, console shows update ✅

### Add Custom User
**Action**: In console, run:
```javascript
demoMode.addUser('custom-user', {
    username: 'TestUser',
    fullName: 'Custom Test User',
    email: 'test@example.com',
    latitude: 28.6139,
    longitude: 77.2090,
    city: 'Test City'
})
```
**Expected**: New user added and initialized ✅

---

## Performance Check

**Action**: Monitor performance while demo is running

**Checks**:
- [ ] No excessive memory usage
- [ ] No memory leaks (memory stable over time)
- [ ] CPU usage reasonable (<50%)
- [ ] Map remains responsive
- [ ] No browser slowdown
- [ ] Console not flooded with errors

**How to Check**:
1. Open DevTools (F12)
2. Go to "Performance" or "Memory" tab
3. Record performance profile
4. Run demo for 30 seconds
5. Stop recording
6. Review metrics

---

## Error Check

**Action**: Look for errors in console

**Expected**: ✅ Zero errors (warnings are OK)

**Common Issues** ❌:
- [ ] `Cannot read property 'on' of undefined` → Socket not loaded
- [ ] `demoMode is not defined` → Script not loaded
- [ ] `map is undefined` → Map not initialized
- [ ] Socket connection errors → Server issue

---

## Final Verification

**Overall Test Result**:

- [ ] **✅ All steps completed successfully**
- [ ] **✅ Demo mode enables without errors**
- [ ] **✅ 4 users appear on map**
- [ ] **✅ Users move in real-time**
- [ ] **✅ Console logging shows updates**
- [ ] **✅ Disable removes markers**
- [ ] **✅ No isolation issues**
- [ ] **✅ Performance is acceptable**

---

## Quick Test Summary

| Test | Status |
|------|--------|
| Enable Demo | ✅ PASS |
| Map Markers | ✅ PASS |
| Movement | ✅ PASS |
| Console Logs | ✅ PASS |
| Marker Popup | ✅ PASS |
| Status Command | ✅ PASS |
| Debug Command | ✅ PASS |
| Disable Demo | ✅ PASS |
| Re-enable | ✅ PASS |
| Isolation | ✅ PASS |
| Performance | ✅ PASS |
| Errors | ✅ PASS |

---

## Troubleshooting

If any test fails:

1. **demoMode is not defined**
   - [ ] Check that demo-mode.js is loaded (check Network tab)
   - [ ] Refresh the page
   - [ ] Check home.ejs has the script tag

2. **Markers don't appear**
   - [ ] Check: `console.log(map)` - should return map object
   - [ ] Check: `socket.connected` - should be true
   - [ ] Run: `demoMode.debug()` to verify

3. **Markers don't move**
   - [ ] Check: `demoMode.isRunning()` - should return true
   - [ ] Check: `demoMode.status()` - should show "ENABLED"
   - [ ] Reload page and try again

4. **High memory usage**
   - [ ] Run: `demoMode.disable()`
   - [ ] Check browser for memory leaks
   - [ ] Close and reopen the page

---

## Sign-Off

**Date Tested**: _______________

**Tester Name**: _______________

**Overall Status**: 
- [ ] ✅ All tests PASSED
- [ ] ⚠️ Some tests FAILED (see notes)
- [ ] ❌ Critical issues found

**Notes**:
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Demo Mode Testing Complete!** 🎉

If all tests pass, your demo mode is working perfectly and ready for visual demonstrations and testing!
