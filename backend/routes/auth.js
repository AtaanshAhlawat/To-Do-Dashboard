const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('CRITICAL: JWT secrets not properly configured!');
  process.exit(1);
}

// Register
router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing fields" });
    if (await User.findOne({ username }))
      return res.status(400).json({ error: "User exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();
    res.json({ message: "User registered" });
  } catch (err) {
    next(err);
  }
});

// Login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: user._id, tokenVersion: user.tokenVersion }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userId: user._id, tokenVersion: user.tokenVersion }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ token, refreshToken });
  } catch (err) {
    next(err);
  }
});

// Refresh token
router.post("/refresh", async (req, res, _next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ error: "No refresh token" });
    
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken || payload.tokenVersion !== user.tokenVersion) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens (refresh token rotation)
    const newToken = jwt.sign({ userId: user._id, tokenVersion: user.tokenVersion }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ userId: user._id, tokenVersion: user.tokenVersion }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Update user's refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch {
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

// Logout (invalidate refresh token)
router.post("/logout", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

// Logout from all devices (invalidate all tokens)
router.post("/logout-all", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      user.tokenVersion += 1; // Increment to invalidate all existing tokens
      await user.save();
    }
    res.json({ message: "Logged out from all devices successfully" });
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

    // Delete the user account (this also removes the refresh token)
    await User.findByIdAndDelete(userId);

    res.json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
