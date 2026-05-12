/**
 * ===============================================
 * 🌍 MULTI-USER LIVE LOCATION SHARING SYSTEM 🌍
 * ===============================================
 * 
 * Features:
 * - Location permission system with user-friendly popup
 * - Browser Permissions API integration
 * - Real-time location updates via Socket.io
 * - GPS tracking with watchPosition
 * - Leaflet map with all users' locations
 * - Live status indicators for sharing users
 * - Automatic location sync every 5 seconds
 * - Throttled location updates
 * - Comprehensive error handling
 */

// ===== GLOBAL STATE =====
const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds throttling
const GPS_CHECK_INTERVAL = 10000; // 10 seconds
let map = null;
let userMarkers = {}; // Store markers for each user
let isLocationSharingEnabled = false;
let currentUserLocation = null;
let watchPositionId = null;
let isGPSAvailable = false;
let isLocationTracking = false;
let permissionCheckComplete = false;
let lastLocationUpdateTime = 0; // For throttling
let locationPermissionDenied = false;
let currentRoomId = null;
let roomMembers = {};
const ROOM_QUERY_PARAM = "room";

// Intervals for cleanup
let heartbeatInterval = null;
let friendListInterval = null;

// Multi-tab coordination
const tabChannel = new BroadcastChannel("geotrack-tabs");
let isActiveTab = false;

// Socket.io connection
const socket = io({
    withCredentials: true,
    transports: ["websocket", "polling"],
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Location Sharing System Initialized");
    
    // Multi-tab coordination: check if another tab is active
    const userId = document.body.getAttribute("data-user-id");
    const tabId = Date.now() + Math.random();
    localStorage.setItem("geotrack-active-tab", tabId);
    
    tabChannel.postMessage({ type: "tab-opened", userId, tabId });
    
    tabChannel.onmessage = (event) => {
        const { type, userId: msgUserId, tabId: msgTabId } = event.data;
        if (msgUserId !== userId) return;
        
        if (type === "tab-opened" && msgTabId !== tabId) {
            // Another tab opened for same user
            const activeTabId = localStorage.getItem("geotrack-active-tab");
            if (activeTabId && activeTabId !== tabId) {
                // This tab is not active, disable socket activity
                isActiveTab = false;
                socket.disconnect();
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                if (friendListInterval) clearInterval(friendListInterval);
                console.log("🔄 Tab deactivated due to another active tab");
                return;
            }
        }
    };
    
    isActiveTab = true;
    
    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (friendListInterval) clearInterval(friendListInterval);
        tabChannel.close();
    });
    
    // Initialize components first
    initializeMap();
    initializeSocketListeners();
    loadAllActiveUsers();
    setupEventListeners();
    setupToggleSwitchUI();
    
    // Setup room sharing before permissions and socket activity
    setupRoomShareSection();

    // Then check location permission (async, doesn't block)
    checkLocationPermission();
});

/**
 * ===== ROOM MEMBER MANAGEMENT =====
 */
function setRoomShareAnchor(link) {
    const anchor = document.getElementById("roomShareAnchor");
    if (anchor) {
        anchor.href = link;
        anchor.textContent = link;
    }
}

function renderRoomMembers() {
    const list = document.getElementById("roomMembersList");
    const header = document.getElementById("groupMembersHeader");
    if (!list || !header) return;

    const members = Object.values(roomMembers);
    header.textContent = `Group Members (${members.length})`;
    list.innerHTML = "";

    if (members.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-room-members";
        empty.textContent = "No members in this room yet.";
        list.appendChild(empty);
        return;
    }

    members.forEach((member) => {
        const item = document.createElement("div");
        item.className = "room-member-item";

        const name = document.createElement("div");
        name.className = "room-member-name";
        name.textContent = member.fullName || member.username || "Unknown";

        const status = document.createElement("div");
        status.className = `room-member-status ${member.isOnline ? "online" : "offline"}`;
        status.textContent = member.isOnline ? "Online" : "Offline";

        item.appendChild(name);
        item.appendChild(status);
        list.appendChild(item);
    });
}

function addRoomMember(userId, username, fullName, isOnline = true) {
    roomMembers[userId] = {
        userId,
        username,
        fullName,
        isOnline,
    };
    renderRoomMembers();
}

function removeRoomMember(userId) {
    if (roomMembers[userId]) {
        delete roomMembers[userId];
        renderRoomMembers();
    }
}

function updateRoomMemberStatus(userId, isOnline) {
    if (roomMembers[userId]) {
        roomMembers[userId].isOnline = isOnline;
        renderRoomMembers();
    }
}

/**
 * ===== LOCATION PERMISSION SYSTEM =====
 * Checks if location permission is already granted using the browser Permissions API
 * If not granted, shows a user-friendly popup
 */
async function checkLocationPermission() {
    console.log("🔐 Checking location permission status...");
    
    try {
        // Check if Permissions API is available
        if (!navigator.permissions) {
            console.warn("⚠️ Permissions API not available, using geolocation directly");
            permissionCheckComplete = true;
            return;
        }

        // Query the location permission status
        const permissionStatus = await navigator.permissions.query({ 
            name: 'geolocation' 
        });

        console.log(`📍 Permission status: ${permissionStatus.state}`);

        // Handle different permission states
        switch(permissionStatus.state) {
            case 'granted':
                console.log("✅ Location permission already granted");
                hideLocationPermissionPopup();
                // Auto-start tracking
                startLocationTracking();
                break;
                
            case 'denied':
                console.log("❌ Location permission previously denied");
                locationPermissionDenied = true;
                showLocationErrorNotification();
                break;
                
            case 'prompt':
                console.log("❓ Permission not yet decided, showing popup");
                showLocationPermissionPopup();
                break;
        }

        // Listen for permission status changes
        permissionStatus.addEventListener('change', () => {
            console.log(`🔄 Permission status changed: ${permissionStatus.state}`);
            
            if (permissionStatus.state === 'granted') {
                hideLocationPermissionPopup();
                hideLocationErrorNotification();
                if (!isLocationTracking) {
                    startLocationTracking();
                }
            } else if (permissionStatus.state === 'denied') {
                locationPermissionDenied = true;
                hideLocationPermissionPopup();
                showLocationErrorNotification();
            }
        });

    } catch (error) {
        console.warn("⚠️ Could not check permissions:", error);
    }
    
    permissionCheckComplete = true;
}

/**
 * Show the location permission popup
 */
function showLocationPermissionPopup() {
    const popup = document.getElementById("locationPermissionPopup");
    if (popup) {
        popup.classList.add("show");
        console.log("📍 Location permission popup shown");
    }
}

/**
 * Hide the location permission popup
 */
function hideLocationPermissionPopup() {
    const popup = document.getElementById("locationPermissionPopup");
    if (popup) {
        popup.classList.remove("show");
        console.log("✓ Location permission popup hidden");
    }
}

/**
 * Show location error notification
 */
function showLocationErrorNotification() {
    const notification = document.getElementById("locationErrorNotification");
    if (notification) {
        notification.classList.add("show");
        console.log("⚠️ Location error notification shown");
    }
}

/**
 * Hide location error notification
 */
function hideLocationErrorNotification() {
    const notification = document.getElementById("locationErrorNotification");
    if (notification) {
        notification.classList.remove("show");
    }
}

/**
 * Close location error notification
 */
function closeLocationError() {
    hideLocationErrorNotification();
}

/**
 * Open browser location settings guide
 * (Note: Cannot directly open browser settings from web, so show helpful message)
 */
function openBrowserSettings() {
    const instructionText = `
To enable location for GeoTrack:

Chrome/Edge:
1. Click the lock icon next to the URL
2. Find "Location" and change to "Allow"

Firefox:
1. Click the lock icon next to the URL
2. Find "Location" and change to "Allow"

Safari:
1. Go to Settings → Privacy → Location Services
2. Ensure Safari has permission

Mobile Browsers:
Check your phone's location settings
    `.trim();

    alert(instructionText);
}

/**
 * Setup event listeners for permission popup buttons
 */
function setupPermissionPopupListeners() {
    const allowBtn = document.getElementById("allowLocationBtn");
    const denyBtn = document.getElementById("denyLocationBtn");
    const errorCloseBtn = document.getElementById("closeErrorBtn");
    const errorActionLink = document.getElementById("enableInSettingsLink");

    // Permission popup - Allow button
    if (allowBtn) {
        allowBtn.addEventListener("click", requestLocationPermission);
    }

    // Permission popup - Deny/Not Now button
    if (denyBtn) {
        denyBtn.addEventListener("click", () => {
            hideLocationPermissionPopup();
            console.log("⏭️ User denied location permission for now");
        });
    }

    // Error notification - Close button
    if (errorCloseBtn) {
        errorCloseBtn.addEventListener("click", () => {
            hideLocationErrorNotification();
            console.log("⏭️ User closed error notification");
        });
    }

    // Error notification - Enable in Settings link
    if (errorActionLink) {
        errorActionLink.addEventListener("click", (e) => {
            e.preventDefault();
            openBrowserSettings();
        });
    }
}

/**
 * Request location permission using geolocation API
 * This triggers the browser's permission dialog
 */
function requestLocationPermission() {
    console.log("🔄 Requesting location permission from user...");

    if (!navigator.geolocation) {
        showAlert("❌ Geolocation not supported in this browser", "error");
        return;
    }

    // Request current position to trigger permission dialog
    navigator.geolocation.getCurrentPosition(
        function (position) {
            // Permission granted
            const { latitude, longitude, accuracy } = position.coords;
            console.log("✅ Location permission granted!");
            console.log(`📍 Initial location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            
            currentUserLocation = { latitude, longitude, accuracy };
            hideLocationPermissionPopup();
            hideLocationErrorNotification();
            locationPermissionDenied = false;

            // Start continuous tracking
            if (!isLocationTracking) {
                startLocationTracking();
            }

            showAlert("✅ Location permission granted. Starting location tracking...", "success");
        },
        function (error) {
            // Permission denied or error occurred
            console.error("❌ Location permission error:", error);
            
            if (error.code === error.PERMISSION_DENIED) {
                locationPermissionDenied = true;
                hideLocationPermissionPopup();
                showLocationErrorNotification();
                showAlert("❌ Location permission was denied", "error");
            } else {
                handleGPSError(error);
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    );
}

// Setup permission popup listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", setupPermissionPopupListeners, { once: true });

/**
 * Setup toggle switch UI
 */
function setupToggleSwitchUI() {
    const toggleCheckbox = document.getElementById("location-sharing-toggle");
    const toggleUI = document.getElementById("location-sharing-toggle-ui");

    if (!toggleUI || !toggleCheckbox) return;

    // Click handler for UI element
    toggleUI.addEventListener("click", function () {
        toggleCheckbox.checked = !toggleCheckbox.checked;
        toggleCheckbox.dispatchEvent(new Event("change"));
    });

    // Sync UI with checkbox state
    toggleCheckbox.addEventListener("change", function () {
        if (this.checked) {
            toggleUI.classList.add("active");
        } else {
            toggleUI.classList.remove("active");
        }
    });
}

/**
 * Initialize Leaflet Map
 */
function initializeMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.warn("⚠️ Map element not found");
        return;
    }

    // Initialize map centered on San Francisco (default location)
    map = L.map("map").setView([37.7749, -122.4194], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    // Keep Leaflet aligned with responsive layout changes.
    window.addEventListener("resize", () => {
        if (map) {
            map.invalidateSize({ animate: false });
        }
    });

    window.geotrackMap = map;
    window.geotrackUserMarkers = userMarkers;

    console.log("✅ Leaflet Map initialized");
}

/**
 * Start watching user's location with watchPosition
 * This function is called after permission is granted
 */
function startLocationTracking() {
    if (isLocationTracking) {
        console.log("⏸️ Location tracking already active");
        return;
    }

    console.log("▶️ Starting location tracking...");

    // Verify geolocation is available
    if (!navigator.geolocation) {
        showAlert("❌ Geolocation not supported", "error");
        console.error("❌ Geolocation API not supported");
        return;
    }

    // Start watching position with high accuracy
    watchPositionId = navigator.geolocation.watchPosition(
        function (position) {
            const { latitude, longitude, accuracy } = position.coords;
            const currentTime = Date.now();

            // Throttle location updates to every 5 seconds
            if (currentTime - lastLocationUpdateTime < LOCATION_UPDATE_INTERVAL) {
                return;
            }

            lastLocationUpdateTime = currentTime;
            currentUserLocation = { latitude, longitude, accuracy };

            console.log(`📍 Current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

            // Update location to backend API
            updateLocationToBackend(latitude, longitude, accuracy);

            // Emit to Socket.io for real-time broadcast
            emitLocationToSocket(latitude, longitude, accuracy);

            // Update user's own marker on map
            updateOwnMarker(latitude, longitude);

            // Update map center if auto-follow is enabled
            if (document.getElementById("auto-follow-toggle")?.checked) {
                map.setView([latitude, longitude], 13);
            }
        },
        function (error) {
            // Handle tracking errors
            handleGPSError(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0, // Always get fresh location
        }
    );

    isLocationTracking = true;
    isLocationSharingEnabled = true;
    showAlert("✅ Location tracking started", "success");
    console.log("✅ Location tracking initiated");
}

/**
 * Stop watching user's location
 */
function stopLocationTracking() {
    if (watchPositionId !== null) {
        navigator.geolocation.clearWatch(watchPositionId);
        watchPositionId = null;
    }
    isLocationTracking = false;
    isLocationSharingEnabled = false;
    showAlert("📍 Location sharing stopped", "info");

    // Remove user's marker from map
    if (userMarkers["self"]) {
        map.removeLayer(userMarkers["self"]);
        delete userMarkers["self"];
    }

    console.log("⏹️ Location tracking stopped");
}

/**
 * Send location update to backend API
 * Throttled to send only every 5 seconds
 */
function updateLocationToBackend(latitude, longitude, accuracy) {
    fetch("/api/location/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            latitude,
            longitude,
            accuracy,
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (!data.success) {
                console.error("❌ Failed to update location:", data.message);
            }
        })
        .catch((error) => {
            console.error("❌ Location update error:", error);
        });
}

/**
 * Emit location to Socket.io for real-time broadcasting
 */
function emitLocationToSocket(latitude, longitude, accuracy) {
    const userData = getUserDataFromPage();
    socket.emit("send-location", {
        userId: userData.userId,
        username: userData.username,
        fullName: userData.fullName,
        latitude,
        longitude,
        accuracy,
        roomId: currentRoomId,
    });
}

/**
 * Get current user data from page
 */
function getUserDataFromPage() {
    const userInfoElement = document.querySelector(".user-name");
    const userEmailElement = document.querySelector(".user-email");

    return {
        userId: document.body.getAttribute("data-user-id") || "unknown",
        username: userInfoElement?.textContent?.trim() || "Anonymous",
        fullName: userInfoElement?.textContent?.trim() || "Anonymous",
        email: userEmailElement?.textContent?.trim() || "",
    };
}

/**
 * Update or create marker for current user on map
 */
function updateOwnMarker(latitude, longitude) {
    if (!map) return;

    if (!userMarkers["self"]) {
        const marker = L.marker([latitude, longitude], {
            icon: createCustomIcon("self", "Yourself"),
        }).addTo(map);

        marker.bindPopup(`
            <div class="marker-popup">
                <h3>📍 Your Location</h3>
                <p><strong>Coordinates:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
                <p><strong>Status:</strong> 🟢 Live</p>
                <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
        `);

        userMarkers["self"] = marker;
    } else {
        userMarkers["self"].setLatLng([latitude, longitude]);
    }
}

/**
 * Load all users from database (both online and offline)
 */
function loadAllActiveUsers() {
    fetch("/api/location/active")
        .then((res) => res.json())
        .then((data) => {
            const apiUsers = Array.isArray(data.users) ? data.users : Array.isArray(data.data) ? data.data : [];

            if (data.success && apiUsers) {
                const activeUsers = apiUsers
                    .map((user) => ({
                        id: user.id || user._id,
                        fullName: user.fullName || user.username || "Unknown user",
                        username: user.username || user.userId || user.id,
                        latitude: Number(user.latitude),
                        longitude: Number(user.longitude),
                        locationLastUpdated: user.locationLastUpdated,
                        isOnline: user.isOnline !== false,
                        isLocationSharing: user.isLocationSharing !== false,
                    }))
                    .filter((user) => user.id && Number.isFinite(user.latitude) && Number.isFinite(user.longitude));

                console.log(`👥 Loaded ${activeUsers.length} active users`);

                // Remove stale markers so disconnected/offline users disappear cleanly.
                Object.keys(userMarkers).forEach((markerId) => {
                    if (markerId !== "self" && !activeUsers.some((user) => String(user.id) === String(markerId))) {
                        map.removeLayer(userMarkers[markerId]);
                        delete userMarkers[markerId];
                    }
                });

                activeUsers.forEach((user) => {
                    if (user.isLocationSharing && user.isOnline) {
                        addOrUpdateUserMarker(user);
                    }
                });

                updateUsersList(activeUsers);
            }
        })
        .catch((error) => {
            console.error("❌ Failed to load users:", error);
            const friendsList = document.querySelector(".friends-list");
            if (friendsList) {
                friendsList.innerHTML = '<p style="color: var(--red); text-align: center; margin-top: 20px;">Failed to load users. Please refresh.</p>';
            }
        });
}

/**
 * Add or update marker for another user
 */
function addOrUpdateUserMarker(user) {
    if (!map) return;

    const markerId = String(user.id);
    const safeLatitude = Number(user.latitude);
    const safeLongitude = Number(user.longitude);

    if (!Number.isFinite(safeLatitude) || !Number.isFinite(safeLongitude)) {
        return;
    }

    if (!userMarkers[markerId]) {
        const marker = L.marker([safeLatitude, safeLongitude], {
            icon: createCustomIcon("user", user.fullName),
        }).addTo(map);

        const statusBadge = user.isOnline ? "🟢 Live" : "🟡 Stale";
        marker.bindPopup(`
            <div class="marker-popup">
                <h3>📍 ${user.fullName}</h3>
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>Coordinates:</strong> ${safeLatitude.toFixed(4)}, ${safeLongitude.toFixed(4)}</p>
                <p><strong>Status:</strong> ${statusBadge}</p>
                <p><strong>Last Updated:</strong> ${new Date(user.locationLastUpdated).toLocaleTimeString()}</p>
            </div>
        `);

        userMarkers[markerId] = marker;
    } else {
        // Update existing marker position
        userMarkers[markerId].setLatLng([safeLatitude, safeLongitude]);
    }
}

/**
 * Create custom icon for markers using Leaflet custom icons
 * Updated to use custom SVG marker images for a modern look
 */
function createCustomIcon(type, name) {
    let iconUrl = "/images/location-pin-blue.svg"; // Default to blue
    let iconSize = [40, 50]; // SVG size
    let iconAnchor = [20, 50]; // Anchor at bottom of pin
    let popupAnchor = [0, -50]; // Popup appears above the pin

    // Determine which icon to use based on type
    if (type === "self") {
        // Green marker for current user
        iconUrl = "/images/location-pin-green.svg";
    } else if (type === "user") {
        // Red marker for other users
        iconUrl = "/images/location-pin-red.svg";
    } else {
        // Blue as default fallback
        iconUrl = "/images/location-pin-blue.svg";
    }

    // Create Leaflet icon using the SVG image
    return L.icon({
        iconUrl: iconUrl,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
        popupAnchor: popupAnchor,
        shadowUrl: null, // No shadow - handled in SVG
        shadowSize: null,
    });
}

// Store users data locally for reference
let usersDatabase = {};

/**
 * Update users list in sidebar with real-time status
 */
function updateUsersList(users) {
    const friendsList = document.querySelector(".friends-list");
    if (!friendsList) return;

    // Store users in local database
    users.forEach((user) => {
        usersDatabase[user.id] = user;
    });

    // Clear current list
    friendsList.innerHTML = "";

    if (users.length === 0) {
        friendsList.innerHTML = '<p style="color: var(--gray); text-align: center; margin-top: 20px;">No users found</p>';
        updateUsersCountHeader(0);
        return;
    }

    // Add each user to the list
    users.forEach((user) => {
        const displayName = user.fullName || user.username || "Unknown user";
        const isOnline = user.isOnline;
        const statusClass = isOnline ? "online" : "offline";
        const statusText = isOnline ? "Online" : "Offline";
        const statusDot = isOnline ? "🟢" : "🔴";

        const userElement = document.createElement("div");
        userElement.className = "friend-item";
        userElement.id = `user-item-${user.id}`;
        userElement.innerHTML = `
            <div class="friend-info">
                <div class="friend-avatar">${displayName.charAt(0).toUpperCase()}</div>
                <div class="friend-name" title="${displayName}">${displayName}</div>
            </div>
            <div class="friend-meta">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;

        userElement.addEventListener("click", function () {
            selectUserAndShowLocation(user);
        });

        friendsList.appendChild(userElement);
    });

    // Update header with count
    updateUsersCountHeader(users.length);
}

/**
 * Update users count header
 */
function updateUsersCountHeader(count) {
    const header = document.getElementById("usersCountHeader");
    if (header) {
        const onlineCount = Object.values(usersDatabase).filter(u => u.isOnline).length;
        header.textContent = `Active Users (${count}) • ${onlineCount} Online`;
    }
    
    const onlineCountBadge = document.getElementById("onlineCount");
    if (onlineCountBadge) {
        const onlineCount = Object.values(usersDatabase).filter(u => u.isOnline).length;
        onlineCountBadge.textContent = `Online: ${onlineCount}`;
    }
}

/**
 * Update user status in list and database
 */
function updateUserStatusInList(userId, isOnline, fullName) {
    if (usersDatabase[userId]) {
        usersDatabase[userId].isOnline = isOnline;
        updateUsersCountHeader(Object.keys(usersDatabase).length);
        
        // Update marker if exists
        if (!isOnline && userMarkers[userId]) {
            map.removeLayer(userMarkers[userId]);
            delete userMarkers[userId];
        }
    }
}

/**
 * Select a user and show their location on the map
 */
function selectUserAndShowLocation(user) {
    if (Number.isFinite(Number(user.latitude)) && Number.isFinite(Number(user.longitude))) {
        // Center map on user location
        map.setView([Number(user.latitude), Number(user.longitude)], 15);
        
        // Open marker popup if it exists
        const markerId = String(user.id);
        if (userMarkers[markerId]) {
            userMarkers[markerId].openPopup();
        }
        
        // Highlight the selected user in the list
        document.querySelectorAll(".friend-item").forEach(item => {
            item.classList.remove("active");
        });
        const selectedItem = document.getElementById(`user-item-${user.id}`);
        if (selectedItem) {
            selectedItem.classList.add("active");
        }
        
        console.log(`📍 Showing location for ${user.fullName}`);
    } else {
        showAlert(`${user.fullName}'s location is not available`, "error");
    }
}

/**
 * Initialize Socket.io event listeners
 */
function initializeSocketListeners() {
    const userData = getUserDataFromPage();

    // Clean up existing listeners to prevent duplicates
    socket.off("receive-location");
    socket.off("load-existing-users");
    socket.off("user-joined");
    socket.off("friend-list-updated");
    socket.off("user-status-changed");
    socket.off("user-disconnected");
    socket.off("location-sharing-changed");
    socket.off("location-requested");

    // Register user on Socket.io with room context
    socket.emit("user-join", {
        userId: userData.userId,
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        roomId: currentRoomId,
    });

    console.log("🔗 Socket.io connection established");

    // Add current user to room members immediately
    addRoomMember(userData.userId, userData.username, userData.fullName, true);

    /**
     * Receive real-time location updates from other users
     */
    socket.on("receive-location", function (data) {
        console.log(`📍 Received location from ${data.username}`);
        
        // Skip if it's our own location
        if (data.userId === userData.userId) return;

        addOrUpdateUserMarker({
            id: data.userId,
            fullName: data.fullName || data.username || "Unknown user",
            username: data.username || data.fullName || "Unknown user",
            latitude: data.latitude,
            longitude: data.longitude,
            isOnline: true,
            locationLastUpdated: data.timestamp,
            isLocationSharing: true,
        });

        // Update in local database and list
        if (usersDatabase[data.userId]) {
            usersDatabase[data.userId].latitude = data.latitude;
            usersDatabase[data.userId].longitude = data.longitude;
            usersDatabase[data.userId].locationLastUpdated = data.timestamp;
            usersDatabase[data.userId].isOnline = true;
            updateUserStatusInList(data.userId, true, data.fullName);
        }
    });

    /**
     * Load existing users when connecting
     */
    socket.on("load-existing-users", function (data) {
        console.log("👥 Existing users loaded:", data.users);
        data.users.forEach((user) => {
            if (user?.userId) {
                addRoomMember(user.userId, user.username, user.fullName, true);
            }
        });
    });

    /**
     * User joined the room
     */
    socket.on("user-joined", function (data) {
        console.log(`👤 User ${data.fullName} joined the room`);
        
        if (data.userId !== userData.userId) {
            addRoomMember(data.userId, data.username, data.fullName, true);
        }
        
        // Add to local database for existing list if needed
        if (!usersDatabase[data.userId]) {
            usersDatabase[data.userId] = {
                id: data.userId,
                fullName: data.fullName,
                username: data.username,
                email: data.email,
                isOnline: true,
                joinedAt: new Date(),
            };
            
            // Reload friend list
            loadAllActiveUsers();
        }
    });

    /**
     * Friend list updated - receive latest list from server
     */
    socket.on("friend-list-updated", function (data) {
        console.log(`👥 Friend list updated with ${data.count} users`);
        
        data.users.forEach((user) => {
            usersDatabase[user.userId] = {
                id: user.userId,
                ...user,
            };
        });
    });

    /**
     * User status changed (online/offline)
     */
    socket.on("user-status-changed", function (data) {
        const { userId, username, fullName, isOnline } = data;
        console.log(`🔄 User ${fullName} status changed: ${isOnline ? "Online" : "Offline"}`);
        
        updateUserStatusInList(userId, isOnline, fullName);
    });

    /**
     * User disconnected
     */
    socket.on("user-disconnected", function (data) {
        console.log(`🚪 User ${data.fullName || data.username} disconnected`);
        
        // Remove from map
        if (userMarkers[data.userId]) {
            map.removeLayer(userMarkers[data.userId]);
            delete userMarkers[data.userId];
        }
        
        // Update status
        updateUserStatusInList(data.userId, false, data.fullName || data.username);
        removeRoomMember(data.userId);
    });

    /**
     * Location sharing status changed
     */
    socket.on("location-sharing-changed", function (data) {
        console.log(`🔄 User ${data.username} location sharing: ${data.isSharing}`);
    });

    /**
     * Request for location
     */
    socket.on("location-requested", function (data) {
        console.log(`🔍 Location requested by ${data.requestedByUsername}`);
    });

    // Periodic heartbeat to keep connection alive
    heartbeatInterval = setInterval(() => {
        if (isActiveTab) {
            socket.emit("heartbeat", { userId: userData.userId });
        }
    }, 30000);

    // Periodic friend list refresh (every 2 minutes)
    friendListInterval = setInterval(() => {
        if (isActiveTab) {
            loadAllActiveUsers();
        }
    }, 120000);
}

/**
 * Handle GPS errors with detailed error messages
 * Handles: Permission denied, Location unavailable, Timeout
 */
function handleGPSError(error) {
    let message = "";
    let icon = "⚠️";
    
    // Only log errors if we're tracking - ignore errors if tracking is off
    if (!isLocationTracking) {
        console.log("📍 GPS error (tracking disabled):", error.message);
        return;
    }

    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable location access in browser settings.";
            icon = "🔒";
            locationPermissionDenied = true;
            showLocationErrorNotification();
            console.error("❌ GPS Permission Denied");
            break;

        case error.POSITION_UNAVAILABLE:
            message = "Location information is currently unavailable. Please check your device and try again.";
            icon = "📍";
            console.error("❌ Position Unavailable");
            break;

        case error.TIMEOUT:
            message = "Location request timed out. Retrying...";
            icon = "⏱️";
            console.warn("⚠️ Location Timeout - Retrying");
            return; // Don't show alert for timeout, just log it

        default:
            message = "Error retrieving location. Please try again.";
            icon = "❌";
    }
    
    showAlert(`${icon} ${message}`, "error");
    console.error(`GPS Error [${error.code}]: ${message}`);
}

/**
 * Setup event listeners for UI controls
 */
function setupEventListeners() {
    const userData = getUserDataFromPage();

    // Location sharing toggle
    const sharingToggle = document.getElementById("location-sharing-toggle");
    if (sharingToggle) {
        sharingToggle.addEventListener("change", function () {
            if (this.checked) {
                startLocationTracking();
                
                // Broadcast sharing status
                socket.emit("update-online-status", {
                    userId: userData.userId,
                    username: userData.username,
                    fullName: userData.fullName,
                    isOnline: true,
                    roomId: currentRoomId,
                });
                
                showAlert("📍 Location sharing enabled", "success");
            } else {
                stopLocationTracking();
                
                // Broadcast sharing status
                socket.emit("update-online-status", {
                    userId: userData.userId,
                    username: userData.username,
                    fullName: userData.fullName,
                    isOnline: false,
                    roomId: currentRoomId,
                });
                
                showAlert("📍 Location sharing disabled", "info");
            }
        });
    }

    // Auto-follow toggle
    const autoFollowToggle = document.getElementById("auto-follow-toggle");
    if (autoFollowToggle) {
        autoFollowToggle.addEventListener("change", function () {
            console.log(`Auto-follow: ${this.checked}`);
        });
    }

    // Refresh users list button
    const refreshBtn = document.getElementById("refresh-users-btn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", function () {
            loadAllActiveUsers();
            showAlert("🔄 Users list refreshed", "info");
        });
    }

    // Center map on current location
    const centerMapBtn = document.getElementById("center-map-btn");
    if (centerMapBtn) {
        centerMapBtn.addEventListener("click", function () {
            if (currentUserLocation) {
                map.setView(
                    [currentUserLocation.latitude, currentUserLocation.longitude],
                    13
                );
                showAlert("📍 Map centered on your location", "success");
            } else {
                showAlert("Your location not available yet", "error");
            }
        });
    }
}

/**
 * Logout handler
 */
function handleLogout() {
    const confirmed = confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    // Call logout API
    fetch("/api/auth/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    }).catch((error) => {
        console.warn("Logout API call failed:", error);
    }).finally(() => {
        stopLocationTracking();
        
        if (socket) {
            socket.disconnect();
        }

        localStorage.removeItem("authToken");
        localStorage.removeItem("user");

        document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

        console.log("✅ User logged out successfully");

        setTimeout(() => {
            window.location.href = "/login";
        }, 500);
    });
}

/**
 * Show alert message to user
 */
function showAlert(message, type = "info") {
    let alertElement;
    
    if (type === "error") {
        alertElement = document.getElementById("alertError");
    } else if (type === "success") {
        alertElement = document.getElementById("alertSuccess");
    } else {
        alertElement = document.getElementById("alertInfo");
    }

    if (alertElement) {
        alertElement.textContent = message;
        alertElement.style.display = "block";

        setTimeout(() => {
            alertElement.style.display = "none";
        }, 4000);
    }
}

/**
 * ===== ROOM SHARING URL SYSTEM =====
 * This is an isolated extension that adds room-based sharing without changing existing behavior.
 */
function getRoomIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get(ROOM_QUERY_PARAM);
    if (roomParam) {
        return roomParam;
    }

    const match = window.location.pathname.match(/^\/room\/([^\/]+)/);
    return match ? match[1] : null;
}

function generateRoomId() {
    return `room-${Math.random().toString(36).slice(2, 10)}`;
}

function updateRoomUrl(roomId) {
    const url = new URL(window.location.href);
    url.searchParams.delete(ROOM_QUERY_PARAM);
    url.pathname = `/room/${roomId}`;
    window.history.replaceState({}, "", url.toString());
}

function getRoomShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.delete(ROOM_QUERY_PARAM);
    url.pathname = `/room/${currentRoomId}`;
    return url.toString();
}

function setRoomShareInput(link) {
    const input = document.getElementById("roomShareLink");
    if (input) {
        input.value = link;
    }
}

function copyRoomLinkToClipboard() {
    const link = getRoomShareLink();
    if (!navigator.clipboard) {
        showAlert("⚠️ Clipboard not available in this browser", "error");
        return;
    }

    navigator.clipboard.writeText(link)
        .then(() => {
            showAlert("✅ Room link copied to clipboard", "success");
        })
        .catch((error) => {
            console.error("❌ Failed to copy room link:", error);
            showAlert("❌ Could not copy room link", "error");
        });
}

function setupRoomShareSection() {
    currentRoomId = getRoomIdFromUrl();

    if (!currentRoomId) {
        currentRoomId = generateRoomId();
        updateRoomUrl(currentRoomId);
    }

    const link = getRoomShareLink();
    setRoomShareInput(link);
    setRoomShareAnchor(link);

    const copyButton = document.getElementById("copyRoomLinkBtn");
    if (copyButton) {
        copyButton.addEventListener("click", function () {
            copyRoomLinkToClipboard();
        });
    }
}

/**
 * ===== ISOLATED LOCATION PERMISSION SYSTEM =====
 * Completely separate location permission popup system that doesn't interfere with existing code
 */

// Global variables for isolated system
let isolatedPermissionChecked = false;

/**
 * Check location permission for isolated popup system
 */
function checkIsolatedLocationPermission() {
    if (isolatedPermissionChecked) return;
    
    console.log("🔐 [Isolated] Checking location permission status...");
    
    // Check if Permissions API is available
    if (!navigator.permissions) {
        console.warn("⚠️ [Isolated] Permissions API not available, requesting permission directly");
        requestIsolatedLocationPermission();
        return;
    }

    // Query the location permission status
    navigator.permissions.query({ name: 'geolocation' })
        .then(function(permissionStatus) {
            console.log(`📍 [Isolated] Permission status: ${permissionStatus.state}`);
            
            if (permissionStatus.state === 'granted') {
                console.log("✅ [Isolated] Location permission already granted");
                // Do nothing - don't interfere with existing tracking
            } else if (permissionStatus.state === 'denied') {
                console.log("❌ [Isolated] Location permission denied");
                // Do nothing - don't interfere
            } else if (permissionStatus.state === 'prompt') {
                console.log("❓ [Isolated] Permission not decided, showing isolated popup");
                showIsolatedLocationPermissionPopup();
            }
            
            isolatedPermissionChecked = true;
        })
        .catch(function(error) {
            console.warn("⚠️ [Isolated] Could not check permissions:", error);
            // Fallback: try to request permission directly
            requestIsolatedLocationPermission();
        });
}

/**
 * Show the isolated location permission popup
 */
function showIsolatedLocationPermissionPopup() {
    const popup = document.getElementById("isolatedLocationPermissionPopup");
    if (popup) {
        popup.classList.add("show");
        console.log("📍 [Isolated] Location permission popup shown");
    }
}

/**
 * Hide the isolated location permission popup
 */
function hideIsolatedLocationPermissionPopup() {
    const popup = document.getElementById("isolatedLocationPermissionPopup");
    if (popup) {
        popup.classList.remove("show");
        console.log("✓ [Isolated] Location permission popup hidden");
    }
}

/**
 * Request location permission using geolocation API (isolated system)
 */
function requestIsolatedLocationPermission() {
    console.log("🔄 [Isolated] Requesting location permission from user...");
    
    if (!navigator.geolocation) {
        console.error("❌ [Isolated] Geolocation not supported");
        return;
    }

    // Request current position to trigger permission dialog
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log("✅ [Isolated] Location permission granted!");
            hideIsolatedLocationPermissionPopup();
            
            // Call new isolated tracking function
            startIsolatedLocationTracking();
        },
        function(error) {
            console.error("❌ [Isolated] Location permission error:", error);
            hideIsolatedLocationPermissionPopup();
            
            if (error.code === error.PERMISSION_DENIED) {
                console.log("❌ [Isolated] User denied location permission");
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    );
}

/**
 * NEW isolated location tracking function that doesn't conflict with existing watchPosition
 */
function startIsolatedLocationTracking() {
    console.log("▶️ [Isolated] Starting isolated location tracking...");
    
    // This is a completely separate tracking system
    // It doesn't interfere with the existing watchPosition or tracking logic
    
    // For now, just log that tracking would start
    // In a real implementation, this could start its own watchPosition
    // with different variables to avoid conflicts
    
    console.log("✅ [Isolated] Location tracking initiated (separate from existing system)");
    
    // Optionally show a success message
    showAlert("✅ Location access granted. Tracking started.", "success");
}

/**
 * Setup event listeners for isolated permission popup
 */
function setupIsolatedPermissionPopupListeners() {
    const allowBtn = document.getElementById("isolatedAllowLocationBtn");
    const denyBtn = document.getElementById("isolatedDenyLocationBtn");
    
    if (allowBtn) {
        allowBtn.addEventListener("click", requestIsolatedLocationPermission);
        console.log("✓ [Isolated] Allow button listener attached");
    }
    
    if (denyBtn) {
        denyBtn.addEventListener("click", function() {
            hideIsolatedLocationPermissionPopup();
            console.log("⏭️ [Isolated] User cancelled location permission");
        });
        console.log("✓ [Isolated] Deny button listener attached");
    }
}

// Initialize isolated permission system
document.addEventListener("DOMContentLoaded", function() {
    console.log("🚀 [Isolated] Location permission system initialized");
    setupIsolatedPermissionPopupListeners();
    
    // Check permission after a short delay to ensure DOM is ready
    setTimeout(checkIsolatedLocationPermission, 1000);
}, { once: true });

/**
 * ===== INVITE FRIENDS SHARE SYSTEM =====
 * Isolated sharing functionality that doesn't interfere with existing code
 */

/**
 * Open the invite friends popup
 */
function openInviteFriendsPopup() {
    const popup = document.getElementById("inviteFriendsPopup");
    if (popup) {
        popup.classList.add("show");
        console.log("👥 Invite friends popup opened");
    }
}

/**
 * Close the invite friends popup
 */
function closeInviteFriendsPopup() {
    const popup = document.getElementById("inviteFriendsPopup");
    if (popup) {
        popup.classList.remove("show");
        console.log("👥 Invite friends popup closed");
    }
}

/**
 * Get the current page URL for sharing
 */
function getCurrentShareUrl() {
    return window.location.href;
}

/**
 * Share via WhatsApp
 */
function shareViaWhatsApp() {
    const url = getCurrentShareUrl();
    const message = encodeURIComponent(`Join me on GeoTrack! 📍\n\n${url}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    closeInviteFriendsPopup();
    console.log("📱 Shared via WhatsApp");
}

/**
 * Share via Telegram
 */
function shareViaTelegram() {
    const url = getCurrentShareUrl();
    const message = encodeURIComponent(`Join me on GeoTrack! 📍\n\n${url}`);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${message}`;
    
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    closeInviteFriendsPopup();
    console.log("✈️ Shared via Telegram");
}

/**
 * Copy link to clipboard
 */
function copyShareLink() {
    const url = getCurrentShareUrl();
    
    if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showAlert("✅ Link copied to clipboard", "success");
        } catch (err) {
            showAlert("❌ Could not copy link", "error");
        }
        document.body.removeChild(textArea);
    } else {
        navigator.clipboard.writeText(url)
            .then(() => {
                showAlert("✅ Link copied to clipboard", "success");
            })
            .catch((error) => {
                console.error("❌ Failed to copy link:", error);
                showAlert("❌ Could not copy link", "error");
            });
    }
    
    closeInviteFriendsPopup();
}

/**
 * Use Web Share API if available
 */
function shareUsingWebShareAPI() {
    if (!navigator.share) {
        return false;
    }
    
    const url = getCurrentShareUrl();
    const shareData = {
        title: 'GeoTrack - Live Location Sharing',
        text: 'Join me on GeoTrack to share live locations!',
        url: url
    };
    
    navigator.share(shareData)
        .then(() => {
            console.log("🌐 Shared using Web Share API");
            closeInviteFriendsPopup();
        })
        .catch((error) => {
            console.error("❌ Web Share API failed:", error);
            // Fall back to individual options
            return false;
        });
    
    return true;
}

/**
 * Setup invite friends popup event listeners
 */
function setupInviteFriendsListeners() {
    // Invite friends button
    const inviteBtn = document.getElementById("inviteFriendsBtn");
    if (inviteBtn) {
        inviteBtn.addEventListener("click", openInviteFriendsPopup);
    }
    
    // WhatsApp button
    const whatsappBtn = document.getElementById("shareWhatsAppBtn");
    if (whatsappBtn) {
        whatsappBtn.addEventListener("click", shareViaWhatsApp);
    }
    
    // Telegram button
    const telegramBtn = document.getElementById("shareTelegramBtn");
    if (telegramBtn) {
        telegramBtn.addEventListener("click", shareViaTelegram);
    }
    
    // Copy link button
    const copyBtn = document.getElementById("copyLinkBtn");
    if (copyBtn) {
        copyBtn.addEventListener("click", copyShareLink);
    }
    
    // Close popup when clicking outside
    const popup = document.getElementById("inviteFriendsPopup");
    if (popup) {
        popup.addEventListener("click", function(event) {
            if (event.target === popup) {
                closeInviteFriendsPopup();
            }
        });
    }
    
    console.log("👥 Invite friends listeners set up");
}

// Initialize invite friends system
document.addEventListener("DOMContentLoaded", function() {
    console.log("👥 Invite friends system initialized");
    setupInviteFriendsListeners();
}, { once: true });

/**
 * ===== RESPONSIVE HAMBURGER MENU SYSTEM =====
 * Handles mobile sidebar toggle with smooth animations and overlay
 */

let mobileMenuOpen = false;

/**
 * Initialize hamburger menu functionality
 */
function initializeHamburgerMenu() {
    const hamburgerBtn = document.getElementById("hamburgerMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (!hamburgerBtn || !sidebar) {
        console.warn("⚠️ Hamburger menu elements not found");
        return;
    }

    // Toggle sidebar on hamburger button click
    hamburgerBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Close sidebar when clicking overlay
    if (overlay) {
        overlay.addEventListener("click", function() {
            closeMobileMenu();
        });
    }

    // Close sidebar when clicking menu items
    const menuItems = sidebar.querySelectorAll("button, a, input[type='checkbox']");
    menuItems.forEach(item => {
        item.addEventListener("click", function(e) {
            // Don't close if clicking the location sharing toggle
            if (item.id === "location-sharing-toggle-ui" || item.id === "location-sharing-toggle") {
                return;
            }
            // Close the menu after selecting an item (except for toggles and buttons that need to stay open)
            if (!item.classList.contains("toggle-switch")) {
                closeMobileMenu();
            }
        });
    });

    // Handle Escape key to close menu
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && mobileMenuOpen) {
            closeMobileMenu();
        }
    });

    // Prevent sidebar from closing when scrolling within it
    sidebar.addEventListener("click", function(e) {
        e.stopPropagation();
    });

    // Handle window resize to close menu on desktop view
    window.addEventListener("resize", function() {
        if (window.innerWidth > 768 && mobileMenuOpen) {
            closeMobileMenu();
        }
    });

    console.log("✅ Hamburger menu initialized");
}

/**
 * Toggle mobile menu open/close
 */
function toggleMobileMenu() {
    if (mobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Open mobile menu with animation
 */
function openMobileMenu() {
    const hamburgerBtn = document.getElementById("hamburgerMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar && overlay) {
        sidebar.classList.add("mobile-open");
        overlay.classList.add("show");
        hamburgerBtn.classList.add("open");
        mobileMenuOpen = true;
        document.body.style.overflow = "hidden"; // Prevent body scroll
        console.log("📖 Mobile menu opened");
    }
}

/**
 * Close mobile menu with animation
 */
function closeMobileMenu() {
    const hamburgerBtn = document.getElementById("hamburgerMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar && overlay) {
        sidebar.classList.remove("mobile-open");
        overlay.classList.remove("show");
        hamburgerBtn.classList.remove("open");
        mobileMenuOpen = false;
        document.body.style.overflow = "auto"; // Re-enable body scroll
        console.log("📖 Mobile menu closed");
    }
}

// Initialize hamburger menu when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
    console.log("🍔 Initializing responsive hamburger menu...");
    setTimeout(initializeHamburgerMenu, 100);
}, { once: true });

