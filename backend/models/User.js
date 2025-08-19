const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
  // Track token version for invalidating all tokens when needed
  tokenVersion: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
