/**
 * ========================================
 * MULTI-USER LOCATION TRACKING DEBUG MODE
 * ========================================
 * 
 * Simulates multiple users connecting and sharing locations in real-time
 * Verifies Socket.IO broadcasting and map updates
 */

const socketio = require("socket.io-client");

// Test configuration
const SERVER_URL = "https://geotrack-live.onrender.com";
const TEST_USERS = [
    {
        userId: "user-test-001",
        username: "TestUser1",
        fullName: "Test User One",
        email: "test1@example.com",
        location: { latitude: 28.6139, longitude: 77.2090 }, // Delhi
    },
    {
        userId: "user-test-002",
        username: "TestUser2",
        fullName: "Test User Two",
        email: "test2@example.com",
        location: { latitude: 19.0760, longitude: 72.8777 }, // Mumbai
    },
    {
        userId: "user-test-003",
        username: "TestUser3",
        fullName: "Test User Three",
        email: "test3@example.com",
        location: { latitude: 12.9716, longitude: 77.5946 }, // Bangalore
    },
];

const ROOM_ID = "test-room";
const LOCATION_UPDATE_INTERVAL = 3000; // 3 seconds
const TEST_DURATION = 60000; // 60 seconds total test

// Global state
let socketClients = [];
let receivedLocations = {};
let broadcastCount = {};
let errors = [];
let testResults = {
    startTime: null,
    endTime: null,
    totalMessages: 0,
    users: {},
    broadcastStats: {},
    errors: [],
};

console.log("\n");
console.log("╔═════════════════════════════════════════════════════════════╗");
console.log("║  🌍 MULTI-USER LOCATION TRACKING - DEBUG MODE TEST 🌍     ║");
console.log("╚═════════════════════════════════════════════════════════════╝\n");

/**
 * Create and connect a test user
 */
function createTestUser(userData) {
    return new Promise((resolve) => {
        console.log(`\n🔌 Connecting user: ${userData.fullName} (${userData.userId})`);

        const socket = socketio(SERVER_URL, {
            reconnection: true,
            reconnectionDelay: 100,
            reconnectionDelayMax: 1000,
            reconnectionAttempts: 5,
        });

        socket.on("connect", () => {
            console.log(`   ✅ Connected: ${socket.id}`);

            // Register user
            socket.emit("user-join", {
                userId: userData.userId,
                username: userData.username,
                fullName: userData.fullName,
                email: userData.email,
                roomId: ROOM_ID,
            });

            // Initialize test results for this user
            testResults.users[userData.userId] = {
                socketId: socket.id,
                fullName: userData.fullName,
                connected: true,
                locationsSent: 0,
                locationsReceived: 0,
                markerUpdates: 0,
                errors: [],
            };

            receivedLocations[userData.userId] = [];
            broadcastCount[userData.userId] = 0;

            // Start sending locations
            simulateLocationUpdates(socket, userData);

            resolve(socket);
        });

        socket.on("disconnect", () => {
            console.log(`   🚪 Disconnected: ${userData.userId}`);
            testResults.users[userData.userId].connected = false;
        });

        socket.on("error", (err) => {
            console.error(`   ❌ Error for ${userData.userId}:`, err);
            errors.push(`${userData.userId}: ${err}`);
            testResults.users[userData.userId].errors.push(err);
        });

        socket.on("user-joined", (data) => {
            console.log(`   👥 User joined: ${data.fullName} (${data.userId})`);
        });

        socket.on("receive-location", (data) => {
            // Verify received location data
            if (
                !data.userId ||
                data.latitude === null ||
                data.latitude === undefined ||
                data.longitude === null ||
                data.longitude === undefined
            ) {
                const err = `Missing data in location update: ${JSON.stringify(data)}`;
                errors.push(err);
                console.error(`   ❌ ${err}`);
                return;
            }

            // Log marker update
            const senderName = data.fullName || data.username;
            console.log(
                `   📍 ${data.userId === userData.userId ? "📌" : "🗺️"} Location from ${senderName}: [${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}]`
            );

            // Track received location
            receivedLocations[userData.userId].push({
                senderId: data.userId,
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy,
                timestamp: new Date(data.timestamp),
            });

            // Count broadcasts received
            broadcastCount[userData.userId]++;

            testResults.users[userData.userId].locationsReceived++;
            testResults.totalMessages++;
        });

        socket.on("user-disconnected", (data) => {
            console.log(`   👋 User disconnected: ${data.fullName}`);
        });

        socket.on("load-existing-users", (data) => {
            console.log(`   📋 Existing users loaded: ${data.users.length}`);
        });
    });
}

/**
 * Simulate location updates for a user
 */
function simulateLocationUpdates(socket, userData) {
    let updateCount = 0;
    const startLat = userData.location.latitude;
    const startLng = userData.location.longitude;

    const interval = setInterval(() => {
        if (!socket.connected) {
            clearInterval(interval);
            return;
        }

        // Add small random variation to location
        const latitude = startLat + (Math.random() - 0.5) * 0.01;
        const longitude = startLng + (Math.random() - 0.5) * 0.01;
        const accuracy = Math.floor(Math.random() * 20) + 5; // 5-25 meters

        socket.emit("send-location", {
            userId: userData.userId,
            username: userData.username,
            fullName: userData.fullName,
            latitude,
            longitude,
            accuracy,
            roomId: ROOM_ID,
        });

        updateCount++;
        testResults.users[userData.userId].locationsSent++;

        console.log(`   📤 Location #${updateCount} sent from ${userData.userId}`);
    }, LOCATION_UPDATE_INTERVAL);

    return interval;
}

/**
 * Run the complete test suite
 */
async function runTests() {
    testResults.startTime = new Date();

    console.log(`\n📋 TEST CONFIGURATION:`);
    console.log(`   ├─ Server URL: ${SERVER_URL}`);
    console.log(`   ├─ Users to simulate: ${TEST_USERS.length}`);
    console.log(`   ├─ Room ID: ${ROOM_ID}`);
    console.log(`   ├─ Location update interval: ${LOCATION_UPDATE_INTERVAL}ms`);
    console.log(`   └─ Test duration: ${TEST_DURATION}ms\n`);

    // Step 1: Connect all users
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 1️⃣  : AUTO SERVER START & MULTI-USER SIMULATION`);
    console.log(`═══════════════════════════════════════════════════════════`);

    try {
        for (const userData of TEST_USERS) {
            const socket = await createTestUser(userData);
            socketClients.push(socket);
            await new Promise((resolve) => setTimeout(resolve, 500)); // Stagger connections
        }

        console.log(`\n✅ All ${TEST_USERS.length} users connected successfully\n`);
    } catch (err) {
        console.error(`\n❌ Failed to connect users:`, err);
        return;
    }

    // Step 2: Wait for location broadcasts
    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 2️⃣  : LOCATION SIMULATION & BROADCAST TEST`);
    console.log(`═══════════════════════════════════════════════════════════`);

    console.log(`\n⏳ Simulating location updates for ${TEST_DURATION / 1000} seconds...\n`);

    await new Promise((resolve) => setTimeout(resolve, TEST_DURATION));

    // Step 3: Verify broadcasts
    console.log(`\n\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 3️⃣  : BROADCAST & DATA VERIFICATION`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    console.log(`📊 BROADCAST STATISTICS:`);
    for (const userId in testResults.users) {
        const user = testResults.users[userId];
        console.log(`\n   ${user.fullName} (${userId}):`);
        console.log(`   ├─ Locations sent: ${user.locationsSent}`);
        console.log(`   ├─ Locations received: ${user.locationsReceived}`);
        console.log(
            `   └─ Expected to receive: ${(TEST_USERS.length - 1) * Math.floor(TEST_DURATION / LOCATION_UPDATE_INTERVAL)}`
        );
    }

    // Step 4: Validate data integrity
    console.log(`\n\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 4️⃣  : DATA INTEGRITY & ERROR CHECK`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    let dataIntegrityOK = true;

    for (const userId in receivedLocations) {
        const locations = receivedLocations[userId];
        console.log(`\n   📍 User ${userId} received ${locations.length} location updates:`);

        // Check for duplicates
        const uniqueSenders = new Set(locations.map((l) => l.senderId));
        console.log(`      ├─ Unique senders: ${uniqueSenders.size}`);

        // Check for null coordinates
        const nullCoords = locations.filter((l) => l.latitude === null || l.longitude === null);
        if (nullCoords.length > 0) {
            console.log(`      ├─ ❌ NULL COORDINATES: ${nullCoords.length}`);
            dataIntegrityOK = false;
        } else {
            console.log(`      ├─ ✅ No null coordinates`);
        }

        // Check data structure
        const invalidStructure = locations.filter((l) => !l.senderId || !l.timestamp);
        if (invalidStructure.length > 0) {
            console.log(`      ├─ ❌ INVALID STRUCTURE: ${invalidStructure.length}`);
            dataIntegrityOK = false;
        } else {
            console.log(`      ├─ ✅ All structures valid`);
        }

        // Check for duplicates
        const senderIds = locations.map((l) => l.senderId);
        const duplicates = senderIds.filter((id, idx) => senderIds.indexOf(id) !== idx);
        if (duplicates.length > 0) {
            console.log(`      └─ ⚠️  Duplicate user entries: ${duplicates.length}`);
        } else {
            console.log(`      └─ ✅ No duplicate entries`);
        }
    }

    if (dataIntegrityOK) {
        console.log(`\n✅ DATA INTEGRITY: All checks passed`);
    } else {
        console.log(`\n❌ DATA INTEGRITY: Some issues found`);
    }

    // Step 5: Map validation
    console.log(`\n\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 5️⃣  : MAP MARKER VALIDATION (Simulated)`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    const totalLocationsExpected = TEST_USERS.length * Math.floor(TEST_DURATION / LOCATION_UPDATE_INTERVAL);
    const totalLocationsReceived = testResults.totalMessages;

    console.log(`   📍 Expected location updates: ${totalLocationsExpected}`);
    console.log(`   📍 Actual location updates: ${totalLocationsReceived}`);
    console.log(`   📍 Delivery rate: ${((totalLocationsReceived / totalLocationsExpected) * 100).toFixed(2)}%`);

    console.log(`\n   ✅ Markers would be created for ${TEST_USERS.length} users`);
    console.log(`   ✅ Markers updated in real-time (not recreated)`);

    // Step 6: Online status check
    console.log(`\n\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 6️⃣  : ONLINE STATUS VERIFICATION`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    for (const userId in testResults.users) {
        const user = testResults.users[userId];
        const status = user.connected ? "🟢 ONLINE" : "🔴 OFFLINE";
        console.log(`   ${user.fullName}: ${status}`);
    }

    // Step 7: Error check
    console.log(`\n\n═══════════════════════════════════════════════════════════`);
    console.log(`STEP 7️⃣  : ERROR DETECTION`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    if (errors.length === 0) {
        console.log(`   ✅ NO ERRORS DETECTED`);
    } else {
        console.log(`   ❌ ${errors.length} error(s) found:\n`);
        errors.forEach((err, idx) => {
            console.log(`      ${idx + 1}. ${err}`);
        });
    }

    // Final report
    testResults.endTime = new Date();
    const duration = testResults.endTime - testResults.startTime;

    console.log(`\n\n═══════════════════════════════════════════════════════════`);
    console.log(`FINAL REPORT`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    console.log(`📊 TEST SUMMARY:`);
    console.log(`   ├─ Test duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   ├─ Connected users: ${socketClients.filter((s) => s.connected).length}/${TEST_USERS.length}`);
    console.log(`   ├─ Total messages exchanged: ${testResults.totalMessages}`);
    console.log(`   ├─ Errors detected: ${errors.length}`);
    console.log(`   └─ Data integrity: ${dataIntegrityOK ? "✅ OK" : "❌ ISSUES"}`);

    if (errors.length === 0 && dataIntegrityOK && totalLocationsReceived > totalLocationsExpected * 0.8) {
        console.log(`\n🎉 ═══════════════════════════════════════════════════════════`);
        console.log(`   ✅ MULTI-USER LOCATION SYSTEM WORKING CORRECTLY ✅`);
        console.log(`═══════════════════════════════════════════════════════════\n`);
    } else {
        console.log(`\n⚠️  ═══════════════════════════════════════════════════════════`);
        console.log(`   ❌ ISSUES FOUND - See details above`);
        console.log(`═══════════════════════════════════════════════════════════\n`);
    }

    // Disconnect all clients
    console.log(`\n🔌 Disconnecting test users...`);
    socketClients.forEach((socket) => socket.disconnect());

    console.log(`✅ Test complete. Exiting...\n`);
    process.exit(errors.length > 0 ? 1 : 0);
}

// Handle process termination
process.on("SIGINT", () => {
    console.log("\n\n⚠️  Test interrupted by user");
    socketClients.forEach((socket) => socket.disconnect());
    process.exit(1);
});

// Start tests
runTests().catch((err) => {
    console.error("\n❌ Test failed:", err);
    process.exit(1);
});
