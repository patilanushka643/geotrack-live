(function () {
    const SESSION_KEY = "geotrack_location_popup_shown";
    const POPUP_ID = "geotrackPermissionPopup";
    const PANEL_ID = "geotrackUserPanel";
    const TOAST_ID = "geotrackPermissionToast";
    const MARKER_UPDATE_THROTTLE_MS = 3000;

    let activeUsers = [];
    let currentUserStatus = "offline";
    let markerCache = {};
    let lastMarkerUpdateAt = 0;
    let followMe = true;

    function installStyles() {
        if (document.getElementById("geotrack-location-module-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "geotrack-location-module-styles";
        style.textContent = `
            #${POPUP_ID}, #${PANEL_ID}, #${TOAST_ID} {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            #locationPermissionPopup,
            #isolatedLocationPermissionPopup,
            #simpleLocationPermissionPopup {
                display: none !important;
            }

            #${POPUP_ID} {
                position: fixed;
                inset: 0;
                display: grid;
                place-items: center;
                background: rgba(15, 23, 42, 0.88);
                z-index: 99999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 180ms ease, visibility 180ms ease;
            }

            #${POPUP_ID}.show {
                opacity: 1;
                visibility: visible;
            }

            #${POPUP_ID} .geotrack-card {
                width: min(460px, calc(100% - 32px));
                padding: 28px 28px 20px;
                border-radius: 22px;
                background: #111827;
                border: 1px solid rgba(148, 163, 184, 0.14);
                box-shadow: 0 32px 80px rgba(0, 0, 0, 0.32);
                text-align: center;
                color: #f8fafc;
            }

            #${POPUP_ID} .geotrack-card h2 {
                margin: 0 0 12px;
                font-size: 22px;
                line-height: 1.2;
            }

            #${POPUP_ID} .geotrack-card p {
                margin: 0 0 24px;
                color: #cbd5e1;
                font-size: 15px;
                line-height: 1.7;
            }

            #${POPUP_ID} .geotrack-actions {
                display: grid;
                gap: 12px;
            }

            #${POPUP_ID} button {
                border: none;
                border-radius: 999px;
                padding: 14px 18px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: transform 150ms ease, background-color 150ms ease;
            }

            #${POPUP_ID} button:hover {
                transform: translateY(-1px);
            }

            #${POPUP_ID} .allow-btn {
                background: #2563eb;
                color: #ffffff;
            }

            #${POPUP_ID} .cancel-btn {
                background: rgba(148, 163, 184, 0.14);
                color: #e2e8f0;
            }

            #${PANEL_ID} {
                position: fixed;
                right: 16px;
                top: 80px;
                width: min(320px, calc(100% - 32px));
                max-height: calc(100vh - 140px);
                background: rgba(15, 23, 42, 0.96);
                border: 1px solid rgba(148, 163, 184, 0.18);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 18px 60px rgba(0, 0, 0, 0.32);
                z-index: 99990;
                color: #f8fafc;
                display: flex;
                flex-direction: column;
                font-size: 14px;
            }

            #${PANEL_ID} .panel-header {
                padding: 16px 18px;
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 12px;
                align-items: center;
                background: rgba(255, 255, 255, 0.04);
            }

            #${PANEL_ID} .panel-header h3 {
                margin: 0;
                font-size: 15px;
                letter-spacing: 0.03em;
            }

            #${PANEL_ID} .panel-status {
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(16, 185, 129, 0.12);
                color: #a7f3d0;
                font-weight: 700;
                text-align: center;
                white-space: nowrap;
            }

            #${PANEL_ID} .follow-toggle {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(59, 130, 246, 0.12);
                color: #bfdbfe;
                font-size: 12px;
                cursor: pointer;
                user-select: none;
            }

            #${PANEL_ID} .follow-toggle.active {
                background: rgba(16, 185, 129, 0.16);
                color: #a7f3d0;
            }

            #${PANEL_ID} .user-list {
                overflow-y: auto;
                flex: 1;
                padding: 10px 0;
            }

            #${PANEL_ID} .user-item {
                display: grid;
                grid-template-columns: auto 1fr auto;
                gap: 12px;
                align-items: center;
                padding: 12px 18px;
                cursor: pointer;
                transition: background 160ms ease;
                border-bottom: 1px solid rgba(148, 163, 184, 0.08);
                background: transparent;
            }

            #${PANEL_ID} .user-item:hover {
                background: rgba(148, 163, 184, 0.08);
            }

            #${PANEL_ID} .user-item.active {
                background: rgba(59, 130, 246, 0.12);
            }

            #${PANEL_ID} .user-item.current {
                border-left: 3px solid #2563eb;
            }

            #${PANEL_ID} .avatar {
                width: 38px;
                height: 38px;
                border-radius: 12px;
                display: grid;
                place-items: center;
                background: rgba(99, 102, 241, 0.12);
                color: #a5b4fc;
                font-weight: 700;
            }

            #${PANEL_ID} .user-name {
                font-weight: 700;
                margin-bottom: 4px;
                color: #f8fafc;
            }

            #${PANEL_ID} .user-status {
                color: #cbd5e1;
                font-size: 13px;
            }

            #${PANEL_ID} .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 6px;
            }

            #${TOAST_ID} {
                position: fixed;
                bottom: 18px;
                right: 18px;
                background: rgba(15, 23, 42, 0.98);
                color: #f8fafc;
                border-radius: 16px;
                padding: 14px 18px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
                z-index: 99999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 160ms ease, visibility 160ms ease;
            }

            #${TOAST_ID}.show {
                opacity: 1;
                visibility: visible;
            }

            #${POPUP_ID} .status-line {
                margin-top: 14px;
                color: #94a3b8;
                font-size: 13px;
            }
        `;
        document.head.appendChild(style);
    }

    function createPopup() {
        if (document.getElementById(POPUP_ID)) {
            return;
        }

        // Also hide any existing permission popups from other modules
        const existingPopups = document.querySelectorAll("#locationPermissionPopup, #isolatedLocationPermissionPopup, #simpleLocationPermissionPopup");
        existingPopups.forEach(popup => popup.style.display = "none");

        const wrapper = document.createElement("div");
        wrapper.id = POPUP_ID;
        wrapper.innerHTML = `
            <div class="geotrack-card" role="dialog" aria-modal="true" aria-labelledby="geotrackPermissionTitle">
                <h2 id="geotrackPermissionTitle">Allow location access?</h2>
                <p>Enable live location sharing so you can see nearby users and stay connected in real time.</p>
                <div class="geotrack-actions">
                    <button type="button" class="allow-btn" id="geotrackAllowBtn">Allow</button>
                    <button type="button" class="cancel-btn" id="geotrackCancelBtn">Cancel</button>
                </div>
                <div class="status-line" id="geotrackPermissionStatus">This reminder appears once per session.</div>
            </div>
        `;

        document.body.appendChild(wrapper);

        const allowBtn = wrapper.querySelector("#geotrackAllowBtn");
        const cancelBtn = wrapper.querySelector("#geotrackCancelBtn");

        if (allowBtn) {
            allowBtn.addEventListener("click", handlePermissionAllow);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", handlePermissionCancel);
        }
    }

    function createPanel() {
        if (document.getElementById(PANEL_ID)) {
            return;
        }

        const panel = document.createElement("aside");
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <div class="panel-header">
                <div>
                    <h3>Live Users</h3>
                    <div class="panel-status" id="geotrackPanelStatus">Waiting for updates</div>
                </div>
                <div class="follow-toggle active" id="geotrackFollowToggle">Follow Me</div>
            </div>
            <div class="user-list" id="geotrackUserList"></div>
        `;

        document.body.appendChild(panel);

        const followToggle = panel.querySelector("#geotrackFollowToggle");
        if (followToggle) {
            followToggle.addEventListener("click", () => {
                followMe = !followMe;
                followToggle.classList.toggle("active", followMe);
                followToggle.textContent = followMe ? "Follow Me" : "Follow Off";
                showToast(followMe ? "Follow Me enabled" : "Follow Me disabled");
            });
        }
    }

    function createToast() {
        if (document.getElementById(TOAST_ID)) {
            return;
        }

        const toast = document.createElement("div");
        toast.id = TOAST_ID;
        document.body.appendChild(toast);
    }

    function showToast(message) {
        const toast = document.getElementById(TOAST_ID);
        if (!toast) {
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.setTimeout(() => {
            toast.classList.remove("show");
        }, 3200);
    }

    function showPopup() {
        const popup = document.getElementById(POPUP_ID);
        if (!popup) {
            return;
        }

        popup.classList.add("show");
        sessionStorage.setItem(SESSION_KEY, "true");
    }

    function hidePopup() {
        const popup = document.getElementById(POPUP_ID);
        if (!popup) {
            return;
        }

        popup.classList.remove("show");
    }

    function getUserDataFromPage() {
        const userInfoElement = document.getElementById("userFullName");
        const userEmailElement = document.getElementById("userEmail");

        return {
            userId: document.body.getAttribute("data-user-id") || "unknown",
            username: userInfoElement?.textContent?.trim() || "Anonymous",
            fullName: userInfoElement?.textContent?.trim() || "Anonymous",
            email: userEmailElement?.textContent?.trim() || "",
        };
    }

    function getMapInstance() {
        if (window.geotrackMap) {
            return window.geotrackMap;
        }

        if (window.map) {
            window.geotrackMap = window.map;
            return window.geotrackMap;
        }

        return null;
    }

    function handlePermissionAllow() {
        const statusLine = document.getElementById("geotrackPermissionStatus");
        if (statusLine) {
            statusLine.textContent = "Requesting location access...";
        }

        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser.");
            handlePermissionCancel("location-disabled");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function () {
                hidePopup();
                sessionStorage.setItem(SESSION_KEY, "true");
                currentUserStatus = "online";
                emitStatusChange("online");

                if (typeof startLocationTracking === "function") {
                    startLocationTracking();
                }

                showToast("Location tracking enabled");
            },
            function (error) {
                if (error?.code === error.PERMISSION_DENIED) {
                    handlePermissionCancel("location-disabled");
                    return;
                }

                showToast(`Location error: ${error?.message || "Unable to get permission"}`);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }

    function handlePermissionCancel(status = "location-disabled") {
        hidePopup();
        currentUserStatus = status;
        emitStatusChange(status);
        renderActiveUsersPanel();
        showToast(status === "location-disabled" ? "Location access denied" : "Location tracking stopped");
    }

    function emitStatusChange(status) {
        const userData = getUserDataFromPage();
        if (!window.socket) {
            return;
        }

        socket.emit("update-online-status", {
            userId: userData.userId,
            username: userData.username,
            fullName: userData.fullName,
            isOnline: status === "online",
            status,
            roomId: window.currentRoomId,
        });
    }

    function createMarkerIcon(user) {
        const self = getUserDataFromPage();
        const isSelf = user.userId === self.userId;
        const color = isSelf ? "#2563eb" : "#dc2626";

        return L.divIcon({
            html: `
                <div style="
                    background-color: ${color};
                    border: 2px solid white;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.26);
                ">
                    ${isSelf ? "??" : "??"}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
            className: "geotrack-user-marker",
        });
    }

    function formatLastSeen(ms) {
        if (ms === null || ms === undefined) {
            return "No recent activity";
        }

        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) {
            return `${seconds}s ago`;
        }

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }

    function formatStatusLabel(status) {
        switch (status) {
            case "online":
                return "Online";
            case "offline":
                return "Offline";
            case "location-disabled":
                return "Location off";
            default:
                return "Unknown";
        }
    }

    function createOrUpdateMarker(user) {
        const map = getMapInstance();
        if (!map || !user.latitude || !user.longitude || user.status !== "online") {
            return;
        }

        const markerId = user.userId;
        const popupHtml = `
            <div style="font-size:13px; line-height:1.4;">
                <strong>${user.fullName || user.username || "Unknown"}</strong><br>
                ${formatStatusLabel(user.status)}
                ${user.status !== "online" && user.lastSeenMs ? `<br>${formatLastSeen(user.lastSeenMs)}` : ""}
            </div>
        `;

        if (!markerCache[markerId]) {
            const marker = L.marker([user.latitude, user.longitude], {
                icon: createMarkerIcon(user),
            }).addTo(map);

            marker.bindPopup(popupHtml);
            marker.on("click", () => {
                map.flyTo([user.latitude, user.longitude], 15, { animate: true, duration: 0.6 });
                marker.openPopup();
            });
            markerCache[markerId] = marker;
            return;
        }

        const marker = markerCache[markerId];
        marker.setLatLng([user.latitude, user.longitude]);
        marker.setIcon(createMarkerIcon(user));
        if (marker.getPopup()) {
            marker.setPopupContent(popupHtml);
        }
    }

    function removeMarker(userId) {
        const marker = markerCache[userId];
        if (!marker) {
            return;
        }

        marker.remove();
        delete markerCache[userId];
    }

    function updateMarkers(users) {
        const self = getUserDataFromPage();
        const onlineUsers = users.filter((user) => user.status === "online" && user.latitude && user.longitude);

        onlineUsers.forEach((user) => {
            if (user.userId === self.userId) {
                return;
            }
            createOrUpdateMarker(user);
        });

        const activeUserIds = new Set(onlineUsers.map((user) => user.userId));
        Object.keys(markerCache).forEach((userId) => {
            if (!activeUserIds.has(userId)) {
                removeMarker(userId);
            }
        });

        if (followMe) {
            const selfEntry = users.find((user) => user.userId === self.userId && user.latitude && user.longitude);
            if (selfEntry) {
                const map = getMapInstance();
                if (map) {
                    map.flyTo([selfEntry.latitude, selfEntry.longitude], 13, { animate: true, duration: 0.6 });
                }
            }
        }
    }

    function hasPanelChanged(newUsers, oldUsers) {
        if (newUsers.length !== oldUsers.length) {
            return true;
        }

        for (let i = 0; i < newUsers.length; i += 1) {
            const current = newUsers[i];
            const previous = oldUsers[i];
            if (!previous || current.userId !== previous.userId || current.status !== previous.status || current.fullName !== previous.fullName || current.lastSeenMs !== previous.lastSeenMs) {
                return true;
            }
        }

        return false;
    }

    function renderActiveUsersPanel() {
        const list = document.getElementById("geotrackUserList");
        if (!list) {
            return;
        }

        const self = getUserDataFromPage();
        const sortedUsers = [...activeUsers].sort((a, b) => {
            if (a.userId === self.userId) return -1;
            if (b.userId === self.userId) return 1;
            if (a.status === b.status) {
                return (a.fullName || "").localeCompare(b.fullName || "");
            }
            return a.status === "online" ? -1 : 1;
        });

        list.innerHTML = "";

        sortedUsers.forEach((user) => {
            const row = document.createElement("button");
            row.type = "button";
            row.className = "user-item";
            if (user.userId === self.userId) {
                row.classList.add("current");
            }

            const dotColor = user.status === "online" ? "#22c55e" : "#ef4444";
            const statusText = formatStatusLabel(user.status);
            const lastSeenText = user.status !== "online" && user.lastSeenMs ? formatLastSeen(user.lastSeenMs) : null;

            row.innerHTML = `
                <div class="avatar">${(user.fullName || user.username || "?").charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-name">${user.fullName || user.username || "Unknown"}</div>
                    <div class="user-status"><span class="status-dot" style="background:${dotColor}"></span>${statusText}${lastSeenText ? ` � ${lastSeenText}` : ""}</div>
                </div>
                <div class="panel-status">${user.userId === self.userId ? "You" : ""}</div>
            `;

            row.addEventListener("click", () => {
                centerOnUser(user);
                document.querySelectorAll(`#${PANEL_ID} .user-item`).forEach((item) => item.classList.remove("active"));
                row.classList.add("active");
            });

            list.appendChild(row);
        });

        updatePanelHeader();
    }

    function updatePanelHeader() {
        const panelStatus = document.getElementById("geotrackPanelStatus");
        if (!panelStatus) {
            return;
        }

        const onlineCount = activeUsers.filter((user) => user.status === "online").length;
        panelStatus.textContent = `${onlineCount} online � ${activeUsers.length} total`;
    }

    function centerOnUser(user) {
        const map = getMapInstance();
        if (!map) {
            showToast("Map is not ready yet");
            return;
        }

        if (!user.latitude || !user.longitude) {
            showToast("Location not available for this user");
            return;
        }

        map.flyTo([user.latitude, user.longitude], 15, { animate: true, duration: 0.7 });

        const marker = markerCache[user.userId];
        if (marker?.openPopup) {
            marker.openPopup();
        }
    }

    function handleActiveUserList(data) {
        if (!Array.isArray(data)) {
            return;
        }

        const newUsers = data.map((user) => ({
            userId: user.userId,
            username: user.username,
            fullName: user.fullName,
            latitude: user.latitude,
            longitude: user.longitude,
            status: user.status || "offline",
            lastUpdated: user.lastUpdated || null,
            lastSeenMs: user.lastSeenMs ?? (user.lastUpdated ? Math.max(0, Date.now() - new Date(user.lastUpdated).getTime()) : null),
        }));

        const oldUsers = activeUsers;
        activeUsers = newUsers;

        if (hasPanelChanged(newUsers, oldUsers)) {
            renderActiveUsersPanel();
        }

        if (Date.now() - lastMarkerUpdateAt > MARKER_UPDATE_THROTTLE_MS) {
            lastMarkerUpdateAt = Date.now();
            updateMarkers(newUsers);
        }
    }

    function setupSocketListeners() {
        if (!window.socket) {
            return;
        }

        // Clean up existing listeners to prevent duplicates
        socket.off("active-user-list", handleActiveUserList);

        socket.on("active-user-list", handleActiveUserList);
    }

    function init() {
        installStyles();
        createPopup();
        createPanel();
        createToast();
        setupSocketListeners();

        if (!sessionStorage.getItem(SESSION_KEY)) {
            showPopup();
        } else {
            renderActiveUsersPanel();
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
