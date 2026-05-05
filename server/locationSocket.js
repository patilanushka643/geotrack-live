const ActiveLocation = require("../models/ActiveLocation");

module.exports = function (io) {
    const activeUserLocations = {};
    const userSocketCounts = {};
    const pendingDbWrites = {};
    const dbWriteTimers = {};
    const DB_WRITE_DELAY_MS = 12000;

    let dbAvailable = true;

    const buildPayload = (user) => ({
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        latitude: user.latitude,
        longitude: user.longitude,
        status: user.status,
        lastUpdated: user.lastUpdated || null,
        lastSeenMs: user.lastUpdated ? Math.max(0, Date.now() - new Date(user.lastUpdated).getTime()) : null,
    });

    const broadcastActiveUserList = () => {
        const payload = Object.values(activeUserLocations).map(buildPayload);
        io.emit("active-user-list", payload);
    };

    const persistActiveLocation = async (userId) => {
        const pending = pendingDbWrites[userId];
        if (!pending) {
            return;
        }

        const payload = {
            userId: pending.userId,
            username: pending.username,
            fullName: pending.fullName,
            latitude: pending.latitude,
            longitude: pending.longitude,
            status: pending.status,
            lastUpdated: pending.lastUpdated || new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        try {
            await ActiveLocation.findOneAndUpdate(
                { userId: payload.userId },
                payload,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }
            );
            dbAvailable = true;
        } catch (error) {
            dbAvailable = false;
            console.error("❌ ActiveLocation DB write failed:", error.message || error);
        } finally {
            delete pendingDbWrites[userId];
        }
    };

    const scheduleDbWrite = (userId, state) => {
        pendingDbWrites[userId] = {
            ...state,
            lastUpdated: new Date(),
        };

        if (dbWriteTimers[userId]) {
            return;
        }

        dbWriteTimers[userId] = setTimeout(async () => {
            delete dbWriteTimers[userId];
            await persistActiveLocation(userId);
        }, DB_WRITE_DELAY_MS);
    };

    const loadDbLocation = async (userId) => {
        try {
            const record = await ActiveLocation.findOne({ userId });
            return record ? record.toObject() : null;
        } catch (error) {
            dbAvailable = false;
            console.error("❌ ActiveLocation DB read failed:", error.message || error);
            return null;
        }
    };

    io.on("connection", (socket) => {
        socket.on("user-join", async (data) => {
            if (!data?.userId) {
                return;
            }

            socket.data.activeLocationUser = {
                userId: data.userId,
                username: data.username,
                fullName: data.fullName,
            };

            userSocketCounts[data.userId] = (userSocketCounts[data.userId] || 0) + 1;

            const existing = activeUserLocations[data.userId] || {};
            const savedState = await loadDbLocation(data.userId);

            const mergedState = {
                userId: data.userId,
                username: data.username || existing.username || savedState?.username || "Unknown",
                fullName: data.fullName || existing.fullName || savedState?.fullName || data.username || "Unknown",
                latitude: existing.latitude ?? savedState?.latitude ?? null,
                longitude: existing.longitude ?? savedState?.longitude ?? null,
                status:
                    existing.status === "location-disabled"
                        ? "location-disabled"
                        : savedState?.status === "location-disabled"
                        ? "location-disabled"
                        : "online",
                lastUpdated: existing.lastUpdated || savedState?.lastUpdated || new Date(),
            };

            activeUserLocations[data.userId] = mergedState;
            socket.emit("active-user-list", Object.values(activeUserLocations).map(buildPayload));
            broadcastActiveUserList();
            scheduleDbWrite(data.userId, mergedState);
        });

        socket.on("send-location", (data) => {
            if (!data?.userId) {
                return;
            }

            const updated = {
                userId: data.userId,
                username: data.username || activeUserLocations[data.userId]?.username || "Unknown",
                fullName: data.fullName || activeUserLocations[data.userId]?.fullName || "Unknown",
                latitude: data.latitude,
                longitude: data.longitude,
                status: "online",
                lastUpdated: new Date(),
            };

            activeUserLocations[data.userId] = updated;
            broadcastActiveUserList();
            scheduleDbWrite(data.userId, updated);
        });

        socket.on("update-online-status", (data) => {
            if (!data?.userId) {
                return;
            }

            const existing = activeUserLocations[data.userId] || {};
            const status = data.status || (data.isOnline ? "online" : "offline");

            const updated = {
                userId: data.userId,
                username: data.username || existing.username || "Unknown",
                fullName: data.fullName || existing.fullName || "Unknown",
                latitude: status === "location-disabled" ? null : existing.latitude || null,
                longitude: status === "location-disabled" ? null : existing.longitude || null,
                status,
                lastUpdated: new Date(),
            };

            activeUserLocations[data.userId] = updated;
            broadcastActiveUserList();
            scheduleDbWrite(data.userId, updated);
        });

        socket.on("disconnect", () => {
            const user = socket.data.activeLocationUser;
            if (!user?.userId) {
                return;
            }

            userSocketCounts[user.userId] = Math.max(0, (userSocketCounts[user.userId] || 1) - 1);
            if (userSocketCounts[user.userId] > 0) {
                return;
            }

            const existing = activeUserLocations[user.userId] || {};
            const offlineState = {
                userId: user.userId,
                username: existing.username || user.username || "Unknown",
                fullName: existing.fullName || user.fullName || "Unknown",
                latitude: null,
                longitude: null,
                status: "offline",
                lastUpdated: new Date(),
            };

            activeUserLocations[user.userId] = offlineState;
            broadcastActiveUserList();
            scheduleDbWrite(user.userId, offlineState);
        });
    });
};
