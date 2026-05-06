const express = require("express");
const { 
    updateLocation, 
    getUsersList, 
    getAllUsers, 
    getAllActiveLocations, 
    getLocationSharingStatus 
} = require("../controllers/locationController");

const { verifyAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// All location routes require authentication
router.use(verifyAuth);

// Update current user's location
router.post("/update", updateLocation);

// Get list of all users with their locations
router.get("/users", getUsersList);

// Get ALL users (both online and offline) - shows all who have logged in
router.get("/all-users", getAllUsers);

// Get all active users currently sharing location
router.get("/active", getAllActiveLocations);

// Get location sharing status for all users
router.get("/sharing-status", getLocationSharingStatus);

// Get specific user's current location
router.get("/user/:userId", getUserLocation);

// Get my current location
router.get("/my-location", getMyLocation);

// Toggle location sharing on/off
router.post("/toggle-sharing", toggleLocationSharing);

// Get location history for a user
router.get("/history/:userId", getLocationHistory);

module.exports = router;
