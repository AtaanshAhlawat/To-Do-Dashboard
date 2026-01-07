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
    
    // Validate username and password
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: "Username must be between 3 and 50 characters" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    next(err);
  }
});

// Login - FIXED: Use User model methods for login attempts
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    // Check if account is locked using virtual property
    if (user.isLocked) {
      return res.status(423).json({ 
        error: "Account is temporarily locked due to too many failed login attempts. Please try again later." 
      });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // FIXED: Use incrementLoginAttempts method from User model
      await user.incrementLoginAttempts();
      return res.status(400).json({ error: "Invalid credentials" });
    }
    
    // FIXED: Use resetLoginAttempts method from User model
    await user.resetLoginAttempts();
    
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

// Refresh token endpoint
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }
    
    // Hash the token to find the user
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const user = await User.findOne({
      'refreshTokens.tokenHash': tokenHash
    });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    
    // Verify refresh token using User model method
    const tokenDoc = user.verifyRefreshToken(refreshToken);
    
    if (!tokenDoc) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    
    // Generate new access token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// Get current user info
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ 
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// Change password
router.post("/change-password", authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    
    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    // Optionally, revoke all refresh tokens for security
    await user.removeAllRefreshTokens();
    
    res.json({ message: "Password changed successfully" });
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
