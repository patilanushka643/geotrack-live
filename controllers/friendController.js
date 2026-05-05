const User = require("../models/User");
const Friendship = require("../models/Friendship");

/**
 * Get all friends of the current user with their location data
 */
async function getFriendsList(req, res) {
  try {
    const userId = req.user.userId;

    // Get the current user and populate friend list
    const user = await User.findById(userId).populate({
      path: "friendList",
      select: "fullName userId email latitude longitude locationLastUpdated isLocationSharing",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Format friends list with online status
    const friendsData = user.friendList.map((friend) => ({
      id: friend._id,
      fullName: friend.fullName,
      username: friend.userId,
      email: friend.email,
      latitude: friend.latitude,
      longitude: friend.longitude,
      locationLastUpdated: friend.locationLastUpdated,
      isLocationSharing: friend.isLocationSharing,
      isOnline: friend.locationLastUpdated &&
        new Date(friend.locationLastUpdated).getTime() > Date.now() - 60000,
      lastUpdateMinutesAgo: friend.locationLastUpdated
        ? Math.floor((Date.now() - new Date(friend.locationLastUpdated).getTime()) / 60000)
        : null,
    }));

    return res.status(200).json({
      success: true,
      message: "Friends list retrieved successfully",
      count: friendsData.length,
      friends: friendsData,
    });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching friends list",
    });
  }
}

/**
 * Get a specific friend's location (with permission check)
 */
async function getFriendLocation(req, res) {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    // Verify user and friend exist
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "Friend not found",
      });
    }

    // Check if they are actually friends
    if (!user.friendList.includes(friendId)) {
      return res.status(403).json({
        success: false,
        message: "You are not friends with this user",
      });
    }

    // Check if friend is sharing location
    if (!friend.isLocationSharing || !friend.latitude || !friend.longitude) {
      return res.status(404).json({
        success: false,
        message: "Friend location not available or sharing disabled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Friend location retrieved successfully",
      friend: {
        id: friend._id,
        fullName: friend.fullName,
        username: friend.userId,
        latitude: friend.latitude,
        longitude: friend.longitude,
        locationLastUpdated: friend.locationLastUpdated,
        isOnline: new Date(friend.locationLastUpdated).getTime() > Date.now() - 60000,
        lastUpdateMinutesAgo: Math.floor(
          (Date.now() - new Date(friend.locationLastUpdated).getTime()) / 60000
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching friend location:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching friend location",
    });
  }
}

/**
 * Send a friend request
 */
async function sendFriendRequest(req, res) {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required",
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    // Check if trying to add self
    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot add yourself as friend",
      });
    }

    // Check if already friends
    const user = await User.findById(userId);
    if (user.friendList.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Already friends with this user",
      });
    }

    // Check if request already exists
    const existingRequest = await Friendship.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: existingRequest.status === "pending" 
          ? "Friend request already pending" 
          : `Already ${existingRequest.status} with this user`,
      });
    }

    // Create friendship request
    const friendship = await Friendship.create({
      user1: userId,
      user2: targetUserId,
      status: "pending",
      requestedBy: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      friendship: {
        id: friendship._id,
        status: friendship.status,
        createdAt: friendship.createdAt,
      },
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending friend request",
    });
  }
}

/**
 * Accept a friend request
 */
async function acceptFriendRequest(req, res) {
  try {
    const userId = req.user.userId;
    const { friendshipId } = req.body;

    if (!friendshipId) {
      return res.status(400).json({
        success: false,
        message: "Friendship ID is required",
      });
    }

    // Find the friendship request
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Check if user is the recipient
    if (friendship.user2.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request",
      });
    }

    // Check if request is still pending
    if (friendship.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${friendship.status}`,
      });
    }

    // Update friendship status
    friendship.status = "accepted";
    await friendship.save();

    // Add both users to each other's friend lists
    await User.findByIdAndUpdate(friendship.user1, {
      $push: { friendList: friendship.user2 },
    });

    await User.findByIdAndUpdate(friendship.user2, {
      $push: { friendList: friendship.user1 },
    });

    return res.status(200).json({
      success: true,
      message: "Friend request accepted",
      friendship: {
        id: friendship._id,
        status: friendship.status,
        updatedAt: friendship.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while accepting friend request",
    });
  }
}

/**
 * Reject or cancel a friend request
 */
async function rejectFriendRequest(req, res) {
  try {
    const userId = req.user.userId;
    const { friendshipId } = req.body;

    if (!friendshipId) {
      return res.status(400).json({
        success: false,
        message: "Friendship ID is required",
      });
    }

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Check authorization (can be rejected by either user)
    if (friendship.user1.toString() !== userId.toString() &&
        friendship.user2.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Delete the friendship request
    await Friendship.findByIdAndDelete(friendshipId);

    return res.status(200).json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while rejecting friend request",
    });
  }
}

/**
 * Remove a friend from friend list
 */
async function removeFriend(req, res) {
  try {
    const userId = req.user.userId;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        message: "Friend ID is required",
      });
    }

    // Remove from both friend lists
    await User.findByIdAndUpdate(userId, {
      $pull: { friendList: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friendList: userId },
    });

    return res.status(200).json({
      success: true,
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing friend",
    });
  }
}

/**
 * Get pending friend requests
 */
async function getPendingRequests(req, res) {
  try {
    const userId = req.user.userId;

    const requests = await Friendship.find({
      user2: userId,
      status: "pending",
    })
      .populate("user1", "fullName userId email")
      .sort({ createdAt: -1 });

    const formattedRequests = requests.map((req) => ({
      id: req._id,
      fromUser: {
        id: req.user1._id,
        fullName: req.user1.fullName,
        username: req.user1.userId,
        email: req.user1.email,
      },
      createdAt: req.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: "Pending requests retrieved",
      count: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching requests",
    });
  }
}

module.exports = {
  getFriendsList,
  getFriendLocation,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingRequests,
};
