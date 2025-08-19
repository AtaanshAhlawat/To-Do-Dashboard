const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// Rate limiting configurations
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for API routes
  message: { error: 'Too many API requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Token blacklist for logout functionality
const tokenBlacklist = new Set();

// Policy definitions
module.exports.policies = {
  // Global policies
  '*': ['apiRateLimit', 'isAuthenticated'],
  
  // Auth routes (public but rate limited)
  'auth/login': ['authRateLimit'],
  'auth/register': ['authRateLimit'],
  'auth/refresh': ['authRateLimit'],
  
  // Protected auth routes
  'auth/logout': ['apiRateLimit', 'isAuthenticated'],
  'auth/logout-all': ['apiRateLimit', 'isAuthenticated'],
  'auth/sessions': ['apiRateLimit', 'isAuthenticated'],
  'auth/delete-account': ['apiRateLimit', 'isAuthenticated', 'isOwner'],
  
  // Task routes with ownership validation
  'tasks/*': ['apiRateLimit', 'isAuthenticated', 'isResourceOwner'],
  'tasks/stats': ['apiRateLimit', 'isAuthenticated'],
  'tasks/bulk': ['apiRateLimit', 'isAuthenticated', 'isResourceOwner'],
};

// Authentication middleware
module.exports.isAuthenticated = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ 
        error: 'Token has been revoked.',
        code: 'TOKEN_REVOKED'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    req.user = user;
    req.token = token; // Store token for potential blacklisting
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Server error during authentication.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Authorization middleware for resource ownership
module.exports.isResourceOwner = async function (req, res, next) {
  try {
    // This middleware should be used after isAuthenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // For task routes, check if user owns the resource
    if (req.params.id) {
      const Task = require('../models/Task');
      const task = await Task.findById(req.params.id);
      
      if (task && !task.user.equals(req.user._id)) {
        return res.status(403).json({ 
          error: 'Access denied. You can only access your own resources.',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Resource ownership check error:', error);
    res.status(500).json({ 
      error: 'Server error during authorization.',
      code: 'AUTHZ_SERVER_ERROR'
    });
  }
};

// Self-ownership check (for account operations)
module.exports.isOwner = async function (req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // For account operations, user can only operate on their own account
    if (req.params.userId && req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied. You can only perform this operation on your own account.',
        code: 'SELF_ACCESS_ONLY'
      });
    }

    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    res.status(500).json({ 
      error: 'Server error during ownership validation.',
      code: 'OWNERSHIP_SERVER_ERROR'
    });
  }
};

// Rate limiting middleware exports
module.exports.authRateLimit = authRateLimit;
module.exports.apiRateLimit = apiRateLimit;

// Token blacklist management
module.exports.blacklistToken = function(token) {
  tokenBlacklist.add(token);
  
  // Clean up blacklist periodically (remove expired tokens)
  // In production, this should be stored in Redis or database
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 15 * 60 * 1000); // Remove after 15 minutes (token expiry time)
};

module.exports.isTokenBlacklisted = function(token) {
  return tokenBlacklist.has(token);
};
