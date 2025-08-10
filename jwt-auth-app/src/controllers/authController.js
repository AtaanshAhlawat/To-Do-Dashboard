import User from '../models/user.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            username, 
            email, 
            password: hashedPassword,
            role: 'user' // Default role
        });

        await newUser.save();

        // Generate JWT token
        const token = generateToken({ 
            id: newUser._id, 
            role: newUser.role 
        });

        // Send response with token and user data (excluding password)
        const userData = {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            success: true,
            token,
            user: userData,
            message: 'User registered successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        next(error); // Pass to global error handler
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({ 
            id: user._id, 
            role: user.role 
        });

        // Prepare user data (excluding password)
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            token,
            user: userData,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        next(error); // Pass to global error handler
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        next(error);
    }
};

/**
 * @desc    Get user dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
export const getUserDashboard = async (req, res, next) => {
    try {
        // Example: Get user data with additional dashboard information
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('tasks', 'title status dueDate')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add any additional dashboard data here
        const dashboardData = {
            user,
            stats: {
                totalTasks: user.tasks?.length || 0,
                completedTasks: user.tasks?.filter(t => t.status === 'completed').length || 0,
                pendingTasks: user.tasks?.filter(t => t.status === 'pending').length || 0
            },
            recentActivity: []
        };

        res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        next(error);
    }
};