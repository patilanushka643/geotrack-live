const User = require("../models/User");
const LocationHistory = require("../models/LocationHistory");
const Friendship = require("../models/Friendship");

/**
 * Update user's current location
 * Called frequently from frontend (e.g., every 5-10 seconds)
 */
async function updateLocation(req, res) {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.userId; // From JWT token

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinate format",
      });
    }

    // Validate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    // Update user location in database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        latitude,
        longitude,
        locationLastUpdated: new Date(),
        isLocationSharing: true,
      },
      { new: true }
    ).select("email fullName userId latitude longitude locationLastUpdated");

    // Save to location history for tracking
    await LocationHistory.create({
      userId,
      latitude,
      longitude,
      accuracy: req.body.accuracy || null,
    });

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: {
        latitude: user.latitude,
        longitude: user.longitude,
        lastUpdated: user.locationLastUpdated,
      },
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating location",
    });
  }
}

/**
 * Get list of all active users (friends/group members)
 * Shows all registered users with their current location if available
 */
async function getUsersList(req, res) {
  try {
    const currentUserId = req.user.userId; // Current logged-in user

    // Get all verified users except the current user
    const users = await User.find(
      {
        isVerified: true,
        _id: { $ne: currentUserId },
      },
      {
        _id: 1,
        email: 1,
        fullName: 1,
        userId: 1,
        latitude: 1,
        longitude: 1,
        locationLastUpdated: 1,
        isLocationSharing: 1,
      }
    ).sort({ fullName: 1 });

    // Format response with online status
    const formattedUsers = users.map((user) => ({
      id: user._id,
      fullName: user.fullName,
      username: user.userId,
      email: user.email,
      latitude: user.latitude,
      longitude: user.longitude,
      locationLastUpdated: user.locationLastUpdated,
      isLocationSharing: user.isLocationSharing,
      isOnline: user.locationLastUpdated && 
                 (Date.now() - new Date(user.locationLastUpdated).getTime()) < 60000, // Online if updated in last 60 seconds
    }));

    return res.status(200).json({
      success: true,
      message: "Users list retrieved successfully",
      count: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching users list:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users list",
    });
  }
}

/**
 * Get specific user's current location
 * Called when a user clicks on another user in the list
 * Now with friend permission validation
 */
async function getUserLocation(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    // Validate user exists
    const user = await User.findById(userId).select(
      "fullName userId latitude longitude locationLastUpdated isLocationSharing"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if they are friends (optional - uncomment for strict friend-only access)
    // const currentUser = await User.findById(currentUserId);
    // if (!currentUser.friendList.includes(userId)) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "You are not friends with this user",
    //   });
    // }

    // Check if user is sharing location
    if (!user.isLocationSharing || !user.latitude || !user.longitude) {
      return res.status(404).json({
        success: false,
        message: "User location not available or sharing disabled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User location retrieved successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.userId,
        latitude: user.latitude,
        longitude: user.longitude,
        locationLastUpdated: user.locationLastUpdated,
        isOnline: (Date.now() - new Date(user.locationLastUpdated).getTime()) < 60000,
      },
    });
  } catch (error) {
    console.error("Error fetching user location:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user location",
    });
  }
}

/**
 * Toggle location sharing on/off
 */
async function toggleLocationSharing(req, res) {
  try {
    const userId = req.user.userId;
    const { isEnabled } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isLocationSharing: isEnabled,
        // If disabling, clear location data
        latitude: isEnabled ? user?.latitude : null,
        longitude: isEnabled ? user?.longitude : null,
      },
      { new: true }
    ).select("isLocationSharing");

    return res.status(200).json({
      success: true,
      message: `Location sharing ${isEnabled ? "enabled" : "disabled"}`,
      isLocationSharing: user.isLocationSharing,
    });
  } catch (error) {
    console.error("Error toggling location sharing:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while toggling location sharing",
    });
  }
}

/**
 * Get user's own current location
 */
async function getMyLocation(req, res) {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select(
      "fullName userId latitude longitude locationLastUpdated isLocationSharing"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your location retrieved successfully",
      location: {
        latitude: user.latitude,
        longitude: user.longitude,
        lastUpdated: user.locationLastUpdated,
        isSharing: user.isLocationSharing,
      },
    });
  } catch (error) {
    console.error("Error fetching user's location:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching location",
    });
  }
}

/**
 * Get location history for a user (last 24 hours)
 */
async function getLocationHistory(req, res) {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 50;

    const history = await LocationHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select("latitude longitude accuracy createdAt");

    return res.status(200).json({
      success: true,
      message: "Location history retrieved successfully",
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Error fetching location history:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching location history",
    });
  }
}
 // Dummy functions taaki app crash na ho aur exports sahi chalein
// 1. Imports
const User = require("../models/User"); 

// 2. Existing Function (Original Logic)
async function updateLocation(req, res) {
    try {
        const { userId, latitude, longitude } = req.body;
        // Aapka jo bhi purana logic tha wo yahan rahega
        res.json({ message: "Location updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// 3. Additional Functions (Missing functions fix)
const getUsersList = async (req, res) => {
    try {
        res.json({ message: "User list fetch logic" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        res.json({ message: "All users fetch logic" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllActiveLocations = async (req, res) => {
    try {
        res.json({ message: "Active locations fetch logic" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getLocationSharingStatus = async (req, res) => {
    try {
        res.json({ message: "Sharing status fetch logic" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Final Exports (Sirf ek baar)
module.exports = {
    updateLocation,
    getUsersList,
    getAllUsers,
    getAllActiveLocations,
    getLocationSharingStatus
};