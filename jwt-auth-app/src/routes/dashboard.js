import express from 'express';
import { getUserDashboard } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', verifyToken, getUserDashboard);

export default router;