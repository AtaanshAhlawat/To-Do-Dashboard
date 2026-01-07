const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption configuration for refresh tokens
// FIXED: Use proper key format for createCipheriv/createDecipheriv
const ENCRYPTION_KEY = process.env.REFRESH_TOKEN_ENCRYPTION_KEY 
  ? Buffer.from(process.env.REFRESH_TOKEN_ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

// Utility functions for token encryption/decryption
// FIXED: Replace deprecated createCipher with createCipheriv
const encryptToken = (token) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// FIXED: Replace deprecated createDecipher with createDecipheriv
const decryptToken = (encryptedToken) => {
  try {
    const textParts = encryptedToken.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Token decryption error:', error.message);
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
    maxlength: 50
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'moderator'],
    default: 'user' 
  },
  refreshTokens: [{
    tokenHash: { 
      type: String, 
      required: true 
    },
    encryptedToken: { 
      type: String, 
      required: true 
    },
    expiresAt: { 
      type: Date, 
      required: true 
    },
    deviceInfo: { 
      type: String, 
      default: '' 
    },
    ipAddress: { 
      type: String, 
      default: '' 
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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
    isActive: true,
    createdAt: new Date()
  });
  
  return this.save();
};

// Method to verify and retrieve refresh token
UserSchema.methods.verifyRefreshToken = function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find matching active token
  const tokenDoc = this.refreshTokens.find(
    rt => rt.tokenHash === tokenHash && 
          rt.isActive && 
          new Date() < rt.expiresAt
  );
  
  if (!tokenDoc) {
    return null;
  }
  
  // Decrypt and verify token matches
  const decryptedToken = decryptToken(tokenDoc.encryptedToken);
  if (decryptedToken === token) {
    return tokenDoc;
  }
  
  return null;
};

// Method to remove specific refresh token (logout)
UserSchema.methods.removeRefreshToken = function(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Mark token as inactive instead of removing
  const tokenDoc = this.refreshTokens.find(
    rt => rt.tokenHash === tokenHash && rt.isActive
  );
  
  if (tokenDoc) {
    tokenDoc.isActive = false;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to remove all refresh tokens (logout from all devices)
UserSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens.forEach(rt => {
    rt.isActive = false;
  });
  return this.save();
};

// Method to increment login attempts
UserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to revoke a specific session/token by device info
UserSchema.methods.revokeSession = function(deviceInfo) {
  const session = this.refreshTokens.find(
    rt => rt.deviceInfo === deviceInfo && 
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
