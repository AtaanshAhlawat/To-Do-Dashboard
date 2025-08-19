const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption configuration for refresh tokens
const ENCRYPTION_KEY = process.env.REFRESH_TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16; // For AES, this is always 16

// Utility functions for token encryption/decryption
const encryptToken = (token) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decryptToken = (encryptedToken) => {
  try {
    const textParts = encryptedToken.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
};

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: { 
    type: String, 
    required: true 
  },
  refreshTokens: [{
    tokenHash: { type: String, required: true }, // Store hash instead of encrypted token
    encryptedToken: { type: String, required: true }, // Encrypted token for validation
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    deviceInfo: { type: String },
    ipAddress: { type: String },
    lastUsed: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, {
  timestamps: true
});

// Index for performance
UserSchema.index({ username: 1 });
UserSchema.index({ 'refreshTokens.tokenHash': 1 });
UserSchema.index({ 'refreshTokens.expiresAt': 1 });

// Method to add refresh token with enhanced security
UserSchema.methods.addRefreshToken = function(token, deviceInfo = '', ipAddress = '') {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  // Create hash and encrypt token for secure storage
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const encryptedToken = encryptToken(token);
  
  this.refreshTokens.push({
    tokenHash,
    encryptedToken,
    expiresAt,
    deviceInfo,
    ipAddress,
    lastUsed: new Date(),
    isActive: true
  });
  
  // Keep only the 5 most recent tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }
  
  return this.save();
};

// Method to validate refresh token with enhanced security
UserSchema.methods.validateRefreshToken = function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tokenData = this.refreshTokens.find(rt => 
    rt.tokenHash === tokenHash && rt.isActive
  );
  
  if (!tokenData) return false;
  
  // Check if token is expired
  if (new Date() > tokenData.expiresAt) {
    // Mark token as inactive instead of removing
    tokenData.isActive = false;
    this.save();
    return false;
  }
  
  // Verify encrypted token matches
  const decryptedToken = decryptToken(tokenData.encryptedToken);
  if (decryptedToken !== token) {
    console.warn('Token validation failed: decrypted token mismatch');
    return false;
  }
  
  // Update last used timestamp
  tokenData.lastUsed = new Date();
  this.save();
  
  return true;
};

// Method to remove refresh token securely
UserSchema.methods.removeRefreshToken = function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const tokenData = this.refreshTokens.find(rt => rt.tokenHash === tokenHash);
  
  if (tokenData) {
    tokenData.isActive = false;
  }
  
  return this.save();
};

// Method to clear all refresh tokens
UserSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens.forEach(rt => {
    rt.isActive = false;
  });
  return this.save();
};

// Method to get active refresh tokens (for session management)
UserSchema.methods.getActiveSessions = function() {
  return this.refreshTokens
    .filter(rt => rt.isActive && new Date() <= rt.expiresAt)
    .map(rt => ({
      deviceInfo: rt.deviceInfo,
      ipAddress: rt.ipAddress,
      createdAt: rt.createdAt,
      lastUsed: rt.lastUsed,
      expiresAt: rt.expiresAt
    }));
};

// Method to revoke specific session
UserSchema.methods.revokeSession = function(deviceInfo, ipAddress) {
  const session = this.refreshTokens.find(rt => 
    rt.deviceInfo === deviceInfo && 
    rt.ipAddress === ipAddress && 
    rt.isActive
  );
  
  if (session) {
    session.isActive = false;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Clean up expired tokens before saving
UserSchema.pre('save', function(next) {
  if (this.refreshTokens && this.refreshTokens.length > 0) {
    // Mark expired tokens as inactive instead of removing them
    this.refreshTokens.forEach(rt => {
      if (new Date() > rt.expiresAt) {
        rt.isActive = false;
      }
    });
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
