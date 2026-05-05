const express = require("express");
const {
  getFriendsList,
  getFriendLocation,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingRequests,
} = require("../controllers/friendController");
const { verifyAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// All friend routes require authentication
router.use(verifyAuth);

// Get all friends of current user
router.get("/", getFriendsList);

// Get specific friend's location (with permission check)
router.get("/:friendId/location", getFriendLocation);

// Send friend request
router.post("/request/send", sendFriendRequest);

// Accept friend request
router.post("/request/accept", acceptFriendRequest);

// Reject/cancel friend request
router.post("/request/reject", rejectFriendRequest);

// Get pending friend requests
router.get("/requests/pending", getPendingRequests);

// Remove friend
router.post("/:friendId/remove", removeFriend);

module.exports = router;
