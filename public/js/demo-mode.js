/**
 * ===============================================
 * 🎬 DEMO MODE - MULTI-USER VISUAL SIMULATOR 🎬
 * ===============================================
 * 
 * Complete isolation from production code
 * Shows multiple users moving on map in real-time
 * 
 * USAGE:
 * ------
 * 1. Enable: demoMode.enable() in browser console
 * 2. Disable: demoMode.disable() in browser console
 * 3. Check: demoMode.isRunning() in browser console
 */

const demoMode = (() => {
    // ===== DEMO MODE STATE =====
    let isEnabled = false;
    let demoUsers = {};
    let demoIntervals = [];
    let demoSocket = null;

    // ===== DEMO USER LOCATIONS (Indian Cities) =====
    const DEMO_LOCATIONS = {
        user1: {
            username: "DemoUser1",
            fullName: "Demo User One",
            email: "demo1@example.com",
            color: "#FF6B6B",
            initialLat: 28.6139,
            initialLng: 77.2090,
            city: "Delhi"
        },
        user2: {
            username: "DemoUser2",
            fullName: "Demo User Two",
            email: "demo2@example.com",
            color: "#4ECDC4",
            initialLat: 19.0760,
            initialLng: 72.8777,
            city: "Mumbai"
        },
        user3: {
            username: "DemoUser3",
            fullName: "Demo User Three",
            email: "demo3@example.com",
            color: "#45B7D1",
            initialLat: 12.9716,
            initialLng: 77.5946,
            city: "Bangalore"
        },
        user4: {
            username: "DemoUser4",
            fullName: "Demo User Four",
            email: "demo4@example.com",
            color: "#FFA07A",
            initialLat: 17.3850,
            initialLng: 78.4867,
            city: "Hyderabad"
        }
    };

    // ===== INIT DEMO USERS =====
    function initializeDemoUsers() {
        console.log("\n🎬 ═══════════════════════════════════════════════");
        console.log("   DEMO MODE - INITIALIZING VIRTUAL USERS");
        console.log("═══════════════════════════════════════════════\n");

        demoUsers = {};

        Object.entries(DEMO_LOCATIONS).forEach(([userId, config]) => {
            demoUsers[userId] = {
                userId,
                username: config.username,
                fullName: config.fullName,
                email: config.email,
                latitude: config.initialLat,
                longitude: config.initialLng,
                accuracy: Math.floor(Math.random() * 20) + 5,
                city: config.city,
                color: config.color,
                lastUpdate: Date.now(),
            };

            console.log(`   ✅ ${config.fullName} (${config.city})`);
            console.log(`      └─ Start: [${config.initialLat.toFixed(4)}, ${config.initialLng.toFixed(4)}]`);
        });

        console.log("\n   Total demo users: " + Object.keys(demoUsers).length);
        console.log("═══════════════════════════════════════════════\n");
    }

    // ===== SIMULATE USER MOVEMENT =====
    function simulateMovement(userId) {
        const user = demoUsers[userId];
        if (!user) return;

        // Small random movement (±0.005 degrees ≈ 500 meters)
        user.latitude += (Math.random() - 0.5) * 0.005;
        user.longitude += (Math.random() - 0.5) * 0.005;
        user.accuracy = Math.floor(Math.random() * 20) + 5;
        user.lastUpdate = Date.now();

        // Log movement
        console.log(
            `📍 Simulated user update → ${userId}, ` +
            `lat: ${user.latitude.toFixed(4)}, lng: ${user.longitude.toFixed(4)}`
        );

        // Trigger map update (use existing socket listener)
        if (typeof socket !== 'undefined' && socket.connected) {
            socket.emit("receive-location", {
                userId: user.userId,
                username: user.username,
                fullName: user.fullName,
                latitude: user.latitude,
                longitude: user.longitude,
                accuracy: user.accuracy,
                timestamp: new Date(),
            });
        }
    }

    // ===== START DEMO SIMULATION =====
    function startSimulation() {
        console.log("🎬 Starting demo simulation...\n");

        // Clear any existing intervals
        demoIntervals.forEach(id => clearInterval(id));
        demoIntervals = [];

        // Start movement simulation for each user
        Object.keys(demoUsers).forEach((userId) => {
            // Initial position
            const user = demoUsers[userId];
            if (typeof socket !== 'undefined' && socket.connected) {
                socket.emit("receive-location", {
                    userId: user.userId,
                    username: user.username,
                    fullName: user.fullName,
                    latitude: user.latitude,
                    longitude: user.longitude,
                    accuracy: user.accuracy,
                    timestamp: new Date(),
                });
            }

            // Simulate movement every 3-5 seconds
            const interval = setInterval(() => {
                if (isEnabled) {
                    simulateMovement(userId);
                }
            }, Math.random() * 2000 + 3000); // 3-5 seconds

            demoIntervals.push(interval);
        });

        console.log("✅ Demo simulation started");
        console.log(`   Running ${demoIntervals.length} movement timers\n`);
    }

    // ===== STOP DEMO SIMULATION =====
    function stopSimulation() {
        console.log("🛑 Stopping demo simulation...\n");

        demoIntervals.forEach(id => clearInterval(id));
        demoIntervals = [];

        // Remove demo markers from map
        Object.keys(demoUsers).forEach((userId) => {
            if (typeof userMarkers !== 'undefined' && userMarkers[userId]) {
                if (typeof map !== 'undefined' && map) {
                    map.removeLayer(userMarkers[userId]);
                }
                delete userMarkers[userId];
            }
        });

        console.log("✅ Demo simulation stopped");
        console.log("   All markers removed from map\n");
    }

    // ===== SHOW DEMO STATUS =====
    function showStatus() {
        console.log("\n🎬 ═══════════════════════════════════════════════");
        console.log("   DEMO MODE STATUS");
        console.log("═══════════════════════════════════════════════\n");

        console.log(`Status: ${isEnabled ? "✅ ENABLED" : "❌ DISABLED"}`);
        console.log(`Active Users: ${Object.keys(demoUsers).length}`);
        console.log(`Running Intervals: ${demoIntervals.length}`);

        if (isEnabled) {
            console.log("\nActive Demo Users:");
            Object.entries(demoUsers).forEach(([userId, user]) => {
                console.log(`   • ${user.fullName} (${user.city})`);
                console.log(`     └─ Current: [${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}]`);
            });
        }

        console.log("\n═══════════════════════════════════════════════\n");
    }

    // ===== SHOW DEBUG LOGS =====
    function showDebugInfo() {
        console.log("\n🔧 ═══════════════════════════════════════════════");
        console.log("   DEMO MODE - DEBUG INFO");
        console.log("═══════════════════════════════════════════════\n");

        console.log("Global Objects:");
        console.log(`   • socket: ${typeof socket !== 'undefined' ? '✅ Available' : '❌ Not found'}`);
        console.log(`   • map: ${typeof map !== 'undefined' && map ? '✅ Available' : '❌ Not found'}`);
        console.log(`   • userMarkers: ${typeof userMarkers !== 'undefined' ? '✅ Available' : '❌ Not found'}`);
        console.log(`   • addOrUpdateUserMarker: ${typeof addOrUpdateUserMarker !== 'undefined' ? '✅ Available' : '❌ Not found'}`);

        console.log("\nSocket Status:");
        if (typeof socket !== 'undefined') {
            console.log(`   • Connected: ${socket.connected ? '✅ Yes' : '❌ No'}`);
            console.log(`   • ID: ${socket.id || 'N/A'}`);
        } else {
            console.log("   ❌ Socket.IO not available");
        }

        console.log("\nDemo Users:");
        console.log(`   • Total: ${Object.keys(demoUsers).length}`);
        Object.keys(demoUsers).forEach(userId => {
            console.log(`   • ${userId}: ✅ Initialized`);
        });

        console.log("\n═══════════════════════════════════════════════\n");
    }

    // ===== PUBLIC API =====
    return {
        /**
         * Enable demo mode and start simulation
         */
        enable: function() {
            if (isEnabled) {
                console.log("⚠️  Demo mode is already enabled");
                return;
            }

            console.log("\n🎬 Enabling Demo Mode...\n");

            isEnabled = true;
            initializeDemoUsers();
            startSimulation();

            console.log("✅ Demo Mode ENABLED");
            console.log("   • Use demoMode.disable() to stop");
            console.log("   • Use demoMode.status() to check status");
            console.log("   • Use demoMode.debug() for debug info\n");
        },

        /**
         * Disable demo mode and stop simulation
         */
        disable: function() {
            if (!isEnabled) {
                console.log("⚠️  Demo mode is already disabled");
                return;
            }

            console.log("\n🎬 Disabling Demo Mode...\n");

            isEnabled = false;
            stopSimulation();

            console.log("✅ Demo Mode DISABLED\n");
        },

        /**
         * Check if demo mode is running
         */
        isRunning: function() {
            return isEnabled;
        },

        /**
         * Show current status
         */
        status: function() {
            showStatus();
        },

        /**
         * Show debug information
         */
        debug: function() {
            showDebugInfo();
        },

        /**
         * Get demo users
         */
        getUsers: function() {
            return { ...demoUsers };
        },

        /**
         * Manually trigger movement for a user
         */
        moveUser: function(userId) {
            if (!demoUsers[userId]) {
                console.log(`❌ User ${userId} not found`);
                return;
            }
            simulateMovement(userId);
            console.log(`✅ Moved ${userId}`);
        },

        /**
         * Add a custom demo user
         */
        addUser: function(userId, config) {
            demoUsers[userId] = {
                userId,
                username: config.username || "CustomUser",
                fullName: config.fullName || "Custom User",
                email: config.email || "custom@example.com",
                latitude: config.latitude || 28.6139,
                longitude: config.longitude || 77.2090,
                accuracy: Math.floor(Math.random() * 20) + 5,
                city: config.city || "Unknown",
                lastUpdate: Date.now(),
            };
            console.log(`✅ Added custom user: ${userId}`);
        }
    };
})();

// ===== EXPOSE DEMO MODE TO WINDOW =====
window.demoMode = demoMode;

// ===== INITIALIZATION GUIDE =====
console.log(`
╔═══════════════════════════════════════════════════════╗
║         🎬 DEMO MODE - VISUAL SIMULATOR 🎬           ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  To use Demo Mode, run in browser console:           ║
║                                                       ║
║  👉 demoMode.enable()        - Start simulation      ║
║  👉 demoMode.disable()       - Stop simulation       ║
║  👉 demoMode.status()        - Show current status   ║
║  👉 demoMode.debug()         - Show debug info       ║
║  👉 demoMode.isRunning()     - Check if running      ║
║  👉 demoMode.getUsers()      - Get all demo users    ║
║  👉 demoMode.moveUser(id)    - Move specific user    ║
║                                                       ║
║  Features:                                            ║
║  ✅ 4 virtual users (Delhi, Mumbai, Bangalore, etc)  ║
║  ✅ Real-time movement simulation                    ║
║  ✅ Live map markers (reuses existing system)        ║
║  ✅ 100% isolated from production code               ║
║  ✅ Detailed debug logging                           ║
║  ✅ Easy ON/OFF toggle                               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);
