import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getCurrentUser 
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/me', authenticate, getCurrentUser);

// Future auth-related routes can be added here:
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password/:token', resetPassword);
// router.post('/logout', authenticate, logoutUser);

export default router;