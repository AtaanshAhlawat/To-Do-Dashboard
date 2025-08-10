import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token, authorization denied.' 
      });
    }

    // Verify token and attach user to request
    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // More specific error messages based on error type
    let errorMessage = 'Authentication failed';
    if (error.message.includes('expired')) {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.message.includes('Invalid')) {
      errorMessage = 'Invalid authentication token.';
    }
    
    return res.status(401).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to check user roles
 * @param {...String} roles - Allowed roles
 * @returns {Function} - Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // This should never happen if used after authenticate middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.'
      });
    }

    // If no roles specified, just check if user is authenticated
    if (roles.length === 0) {
      return next();
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have sufficient permissions to access this resource.'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource
 * @param {String} resourceIdParam - The name of the route parameter containing the resource ID
 * @param {String} [userIdField='_id'] - The field to compare with the resource ID
 * @returns {Function} - Express middleware function
 */
const isOwner = (resourceIdParam, userIdField = '_id') => {
  return (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required.'
        });
      }

      // Check if the user is the owner of the resource
      if (req.user[userIdField] !== resourceId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this resource.'
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying resource ownership.'
      });
    }
  };
};

export { authenticate, authorize, isOwner };