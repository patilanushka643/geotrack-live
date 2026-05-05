# Quick Test Execution Guide

## 🚀 Run the Complete Test (5 Minutes)

### One-Command Execution (PowerShell - Windows)
```powershell
cd c:\Users\Vedant\OneDrive\Desktop\p
.\run-test.ps1
```

### Manual Execution (2 Terminal Windows)

**Terminal 1 - Start Server:**
```bash
cd c:\Users\Vedant\OneDrive\Desktop\p
npm start
```

Wait for:
```
✅ Database connected
🚀 Server running on http://localhost:3000
```

**Terminal 2 - Run Test:**
```bash
cd c:\Users\Vedant\OneDrive\Desktop\p
node test-debug.js
```

---

## ✅ What You'll See

### During Test (60 seconds)
```
🔌 Connecting user: Test User One
✅ Connected: socket-id-xxx
   📤 Location #1 sent from user-test-001
   📍 Location from Test User Two: [19.0760, 72.8777]
   📍 Location from Test User Three: [12.9716, 77.5946]
   ...
```

### At End
```
✅ MULTI-USER LOCATION SYSTEM WORKING CORRECTLY

📊 TEST SUMMARY:
   ├─ Test duration: 61.68s
   ├─ Connected users: 3/3
   ├─ Total messages exchanged: 180
   ├─ Errors detected: 0
   └─ Data integrity: ✅ OK
```

---

## 📊 Test Verifies

- [x] Server starts (Node.js + Socket.IO)
- [x] 3 users connect simultaneously
- [x] Location updates sent every 3 seconds
- [x] Real-time broadcasting to all users
- [x] Data structure validation
- [x] No null coordinates
- [x] Marker updates (not recreated)
- [x] Online/offline status
- [x] Zero errors

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Check .env MONGODB_URI and Port 3000 availability |
| Connection errors | Ensure MongoDB is running |
| Low test scores | Check server logs, restart server |

---

## 📁 Files

- `run-test.ps1` - Orchestration script
- `test-debug.js` - Test client
- `TEST_DEBUG_GUIDE.md` - Full documentation
- `TEST_RESULTS_SUMMARY.md` - Detailed results

---

**Status**: ✅ All tests pass - System working correctly!
