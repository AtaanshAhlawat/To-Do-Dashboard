require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Security middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Connect to MongoDB - FIXED: Use environment variable and remove deprecated options
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todo-dashboard';
mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Health check endpoint (no auth required) - MUST BE BEFORE ROUTES
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes - FIXED: Don't use policyLoader.applyPolicies which breaks app.get
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Import policy loader only for router wrapping
const policyLoader = require('./config/policyLoader');

// Apply policies to routers
const authRouter = policyLoader.applyToRouter(authRoutes, 'auth');
const taskRouter = policyLoader.applyToRouter(taskRoutes, 'tasks');

app.use('/api', authRouter);
app.use('/api/tasks', taskRouter);

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('MongoDB URI:', MONGO_URI);
  console.log('Security policies applied to routes');
  console.log('Rate limiting enabled');
  console.log('Token blacklisting enabled');
});
