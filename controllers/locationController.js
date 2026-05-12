const User = require("../models/User");
const LocationHistory = require("../models/LocationHistory");
const Friendship = require("../models/Friendship");

const formatLocationUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    username: user.userId,
    email: user.email,
    latitude: user.latitude,
    longitude: user.longitude,
    locationLastUpdated: user.locationLastUpdated,
    isLocationSharing: Boolean(user.isLocationSharing),
    isOnline: Boolean(
        user.locationLastUpdated &&
        Date.now() - new Date(user.locationLastUpdated).getTime() < 60000
    ),
});

// 1. UPDATE LOCATION (With History and Validation)
const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const userId = req.user.userId;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
        }

        // Validation Ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ success: false, message: "Invalid coordinate ranges" });
        }

        // Update User Model
        const user = await User.findByIdAndUpdate(
            userId,
            {
                latitude,
                longitude,
                location: { type: "Point", coordinates: [longitude, latitude] },
                locationLastUpdated: new Date(),
                isLocationSharing: true,
            },
            { new: true }
        ).select("email fullName userId latitude longitude locationLastUpdated");

        // Save to History
        await LocationHistory.create({
            userId,
            latitude,
            longitude,
            accuracy: accuracy || null,
        });

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            location: {
                latitude: user.latitude,
                longitude: user.longitude,
                lastUpdated: user.locationLastUpdated,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. GET USERS LIST (With Online Status Logic)
const getUsersList = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const users = await User.find(
            { isVerified: true, _id: { $ne: currentUserId } },
            { _id: 1, email: 1, fullName: 1, userId: 1, latitude: 1, longitude: 1, locationLastUpdated: 1, isLocationSharing: 1 }
        ).sort({ fullName: 1 });

        const formattedUsers = users.map(formatLocationUser);

        res.json({ success: true, users: formattedUsers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. OTHER HELPER FUNCTIONS
const getUserLocation = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("fullName userId latitude longitude locationLastUpdated isLocationSharing");
        if (!user || !user.isLocationSharing) return res.status(404).json({ success: false, message: "Location not available" });
        return res.json({ success: true, user });
    } catch (error) {
        console.error("getUserLocation error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getMyLocation = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("fullName userId latitude longitude locationLastUpdated isLocationSharing");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (!user.isLocationSharing) return res.status(404).json({ success: false, message: "Location not available" });
        return res.json({ success: true, user });
    } catch (error) {
        console.error("getMyLocation error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const toggleLocationSharing = async (req, res) => {
    try {
        const userId = req.user.userId;
        const explicit = typeof req.body.enable === 'boolean';

        let user = await User.findById(userId).select('isLocationSharing');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const newStatus = explicit ? req.body.enable : !user.isLocationSharing;

        user.isLocationSharing = newStatus;
        await user.save();

        return res.json({ success: true, isLocationSharing: user.isLocationSharing });
    } catch (error) {
        console.error("toggleLocationSharing error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isVerified: true })
            .select("_id email fullName userId latitude longitude locationLastUpdated isLocationSharing")
            .sort({ fullName: 1 });

        return res.json({
            success: true,
            users: users.map(formatLocationUser),
            count: users.length,
        });
    } catch (err) {
        console.error("getAllUsers error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getAllActiveLocations = async (req, res) => {
    try {
        // Only users who opted into sharing should appear on the live map.
        const activeUsers = await User.find({
            isVerified: true,
            isLocationSharing: true,
            latitude: { $ne: null },
            longitude: { $ne: null },
        })
            .select("_id email fullName userId latitude longitude locationLastUpdated isLocationSharing")
            .sort({ locationLastUpdated: -1 });

        return res.json({
            success: true,
            users: activeUsers.map(formatLocationUser),
            count: activeUsers.length,
        });
    } catch (err) {
        console.error("getAllActiveLocations error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getLocationSharingStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('isLocationSharing');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({ success: true, status: user.isLocationSharing });
    } catch (err) {
        console.error("getLocationSharingStatus error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

const getLocationHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
        const history = await LocationHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
        return res.json({ success: true, data: history });
    } catch (err) {
        console.error("getLocationHistory error:", err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 4. FINAL EXPORTS
module.exports = {
    updateLocation,
    getUsersList,
    getUserLocation,         // <--- Ye line honi zaroori hai
    toggleLocationSharing,
    getMyLocation,
    getLocationHistory,
    getAllUsers,
    getAllActiveLocations,
    getLocationSharingStatus
};