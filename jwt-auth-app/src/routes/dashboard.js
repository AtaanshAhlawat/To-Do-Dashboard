import express from 'express';
import { getUserDashboard } from '../controllers/authController.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// These routes are already protected by the global auth middleware
// The authorize middleware can be used for role-based access control
router.get('/', authorize('user', 'admin'), getUserDashboard);

// Example of a route that only admins can access
// router.get('/admin', authorize('admin'), adminDashboard);

export default router;