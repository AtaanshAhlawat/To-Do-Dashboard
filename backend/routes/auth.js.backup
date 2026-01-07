const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Task = require("../models/Task");
const { blacklistToken } = require("../config/policies");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

// Generate secure refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Register
router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    const hash = await bcrypt.hash(password, 12); // Increased salt rounds
    const user = new User({ username, password: hash });
    await user.save();
    
    res.json({ message: "User registered successfully" });
  } catch (err) {
    next(err);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ 
        error: "Account is temporarily locked. Please try again later." 
      });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await user.save();
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();
    
    // Generate tokens
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    
    const refreshToken = generateRefreshToken();
    
    // Add refresh token to user with device info
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    await user.addRefreshToken(refreshToken, deviceInfo, ipAddress);
    
    res.json({ 
      token, 
      refreshToken,
      user: { username: user.username }
    });
  } catch (err) {
    next(err);
  }
});

// Refresh token with rotation
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }
    
    // Find user by refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await User.findOne({
      'refreshTokens.tokenHash': tokenHash,
      'refreshTokens.isActive': true
    });
    
    if (!user) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    // Validate refresh token
    if (!user.validateRefreshToken(refreshToken)) {
      return res.status(403).json({ error: "Refresh token expired or invalid" });
    }
    
    // Generate new tokens
    const newToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    
    const newRefreshToken = generateRefreshToken();
    
    // Remove old refresh token and add new one (token rotation)
    await user.removeRefreshToken(refreshToken);
    
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;
    await user.addRefreshToken(newRefreshToken, deviceInfo, ipAddress);
    
    res.json({ 
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    next(err);
  }
});

// Logout (revoke refresh token)
router.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    
    // Blacklist the current access token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      blacklistToken(accessToken);
    }
    
    // Remove refresh token if provided
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const user = await User.findOne({
        'refreshTokens.tokenHash': tokenHash
      });
      
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

// Logout from all devices
router.post("/logout-all", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Blacklist current access token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      blacklistToken(accessToken);
      
      // Get user from token
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        await user.clearAllRefreshTokens();
      }
    }
    
    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    next(err);
  }
});

// Get active sessions
router.get("/sessions", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }
    
    const sessions = user.getActiveSessions();
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// Delete account
router.delete("/delete-account", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete all tasks associated with the user
    await Task.deleteMany({ user: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
