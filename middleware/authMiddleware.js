const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT token from cookie or Authorization header
 * If token is valid, attach user data to req.user
 * If token is invalid or missing, redirect to login
 */
const verifyAuth = (req, res, next) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).redirect("/login");
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    console.error("Auth verification failed:", error.message);
    return res.status(401).redirect("/login");
  }
};

/**
 * Middleware to check if user is already logged in
 * Used for login/signup pages - redirects to home if already authenticated
 */
const checkAlreadyLoggedIn = (req, res, next) => {
  try {
    const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      req.user = decoded;
      // User is already logged in, redirect to home
      return res.redirect("/home");
    }

    next();
  } catch (error) {
    // Token is invalid, allow user to proceed to login/signup
    next();
  }
};

module.exports = { verifyAuth, checkAlreadyLoggedIn };
