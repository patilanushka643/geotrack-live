(function () {
    const POPUP_ID = "simpleLocationPermissionPopup";
    const ALLOW_BTN_ID = "simpleAllowLocationBtn";
    const CANCEL_BTN_ID = "simpleCancelLocationBtn";
    const STYLE_ID = "simple-location-permission-style";

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${POPUP_ID} {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.82);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 180ms ease, visibility 180ms ease;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            #${POPUP_ID}.show {
                opacity: 1;
                visibility: visible;
            }

            .simple-location-permission-card {
                width: min(420px, calc(100% - 32px));
                background: #0f172a;
                border: 1px solid rgba(148, 163, 184, 0.16);
                border-radius: 20px;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
                padding: 26px;
                text-align: center;
            }

            .simple-location-permission-header {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }

            .simple-location-permission-header .icon {
                width: 54px;
                height: 54px;
                border-radius: 50%;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, #3b82f6, #10b981);
                color: #fff;
                font-size: 24px;
            }

            .simple-location-permission-title {
                font-size: 20px;
                color: #fff;
                margin: 0;
                line-height: 1.2;
            }

            .simple-location-permission-text {
                font-size: 14px;
                color: #cbd5e1;
                margin: 0 auto 24px;
                max-width: 320px;
                line-height: 1.6;
            }

            .simple-location-permission-actions {
                display: grid;
                gap: 12px;
            }

            .simple-location-permission-button {
                width: 100%;
                border: none;
                border-radius: 999px;
                padding: 14px 18px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
            }

            .simple-location-permission-button:hover {
                transform: translateY(-1px);
            }

            .simple-location-permission-button:active {
                transform: translateY(0);
            }

            .simple-btn-allow {
                background: #3b82f6;
                color: #fff;
                box-shadow: 0 12px 28px rgba(59, 130, 246, 0.25);
            }

            .simple-btn-cancel {
                background: rgba(148, 163, 184, 0.12);
                color: #cbd5e1;
            }

            #locationPermissionPopup,
            #isolatedLocationPermissionPopup {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }

    function createPopupMarkup() {
        if (document.getElementById(POPUP_ID)) return;

        const wrapper = document.createElement("div");
        wrapper.id = POPUP_ID;
        wrapper.innerHTML = `
            <div class="simple-location-permission-card" role="dialog" aria-modal="true" aria-labelledby="simpleLocationPermissionTitle">
                <div class="simple-location-permission-header">
                    <div class="icon">📍</div>
                    <h2 class="simple-location-permission-title" id="simpleLocationPermissionTitle">Enable Location</h2>
                </div>
                <p class="simple-location-permission-text">
                    Allow location access to share your position instantly and see nearby users on the map.
                </p>
                <div class="simple-location-permission-actions">
                    <button id="${ALLOW_BTN_ID}" class="simple-location-permission-button simple-btn-allow" type="button">Allow</button>
                    <button id="${CANCEL_BTN_ID}" class="simple-location-permission-button simple-btn-cancel" type="button">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(wrapper);
    }

    function showPopup() {
        const popup = document.getElementById(POPUP_ID);
        if (!popup) return;
        popup.classList.add("show");
    }

    function hidePopup() {
        const popup = document.getElementById(POPUP_ID);
        if (!popup) return;
        popup.classList.remove("show");
    }

    function hideLegacyPopups() {
        const oldPopup = document.getElementById("locationPermissionPopup");
        const isolatedPopup = document.getElementById("isolatedLocationPermissionPopup");

        if (oldPopup) {
            oldPopup.style.display = "none";
        }
        if (isolatedPopup) {
            isolatedPopup.style.display = "none";
        }
    }

    function getUserId() {
        return document.body.getAttribute("data-user-id") || "";
    }

    function handlePermissionGranted(position) {
        const { latitude, longitude, accuracy } = position.coords;
        hidePopup();

        if (typeof startLocationTracking === "function") {
            startLocationTracking();
        }

        if (typeof emitLocationToSocket === "function") {
            emitLocationToSocket(latitude, longitude, accuracy);
        }

        if (typeof updateLocationToBackend === "function") {
            updateLocationToBackend(latitude, longitude, accuracy);
        }
    }

    function handlePermissionError(error) {
        console.warn("Location permission failed:", error);
        hidePopup();
    }

    function requestGeoPermission() {
        if (!navigator.geolocation) {
            console.warn("Geolocation API not supported.");
            hidePopup();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            handlePermissionGranted,
            handlePermissionError,
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }

    function setupPopupListeners() {
        const allowBtn = document.getElementById(ALLOW_BTN_ID);
        const cancelBtn = document.getElementById(CANCEL_BTN_ID);

        if (allowBtn) {
            allowBtn.addEventListener("click", function () {
                requestGeoPermission();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", function () {
                hidePopup();
            });
        }
    }

    function shouldShowPopup() {
        if (!getUserId()) {
            return Promise.resolve("denied");
        }

        if (!navigator.permissions) {
            return Promise.resolve("prompt");
        }

        return navigator.permissions.query({ name: "geolocation" })
            .then((status) => status.state)
            .catch(() => "prompt");
    }

    function init() {
        installStyles();
        createPopupMarkup();
        setupPopupListeners();
        hideLegacyPopups();

        shouldShowPopup().then((state) => {
            if (state === "granted") {
                if (typeof startLocationTracking === "function") {
                    startLocationTracking();
                }
                return;
            }

            if (state === "prompt") {
                showPopup();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
