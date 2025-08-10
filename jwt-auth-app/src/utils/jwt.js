import jwt from 'jsonwebtoken';
import { promisify } from 'util';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

// Promisify JWT methods
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

/**
 * Generate a JWT token with the provided payload
 * @param {Object} payload - The data to include in the token
 * @param {String} [expiresIn=JWT_EXPIRATION] - Token expiration time
 * @returns {Promise<String>} - The generated JWT token
 */
export const generateToken = async (payload, expiresIn = JWT_EXPIRATION) => {
  try {
    const token = await signAsync(
      { data: payload },
      JWT_SECRET,
      { expiresIn }
    );
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Generate an access token for a user
 * @param {Object} user - User object containing id and role
 * @returns {Promise<String>} - The generated access token
 */
export const generateAccessToken = async (user) => {
  const payload = {
    id: user.id || user._id,
    role: user.role || 'user',
    type: 'access'
  };
  return generateToken(payload, JWT_EXPIRATION);
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object containing id
 * @returns {Promise<String>} - The generated refresh token
 */
export const generateRefreshToken = async (user) => {
  const payload = {
    id: user.id || user._id,
    type: 'refresh'
  };
  return generateToken(payload, JWT_REFRESH_EXPIRATION);
};

/**
 * Verify a JWT token
 * @param {String} token - The JWT token to verify
 * @returns {Promise<Object>} - The decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyToken = async (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Remove 'Bearer ' prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    const decoded = await verifyAsync(tokenValue, JWT_SECRET);
    return decoded.data; // Return only the payload data
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    // More specific error messages
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Failed to authenticate token');
    }
  }
};

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {String|null} - The extracted token or null if not found
 */
export const getTokenFromHeader = (req) => {
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer ')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};