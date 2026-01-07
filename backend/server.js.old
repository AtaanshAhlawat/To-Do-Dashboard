require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const policyLoader = require('./config/policyLoader');

const app = express();

// Security middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

// Apply policy system to the app
policyLoader.applyPolicies(app);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes with policy integration
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Apply policies to routers
const authRouter = policyLoader.applyToRouter(authRoutes, 'auth');
const taskRouter = policyLoader.applyToRouter(taskRoutes, 'tasks');

app.use('/api', authRouter);
app.use('/api/tasks', taskRouter);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Security policies loaded and applied');
  console.log('Rate limiting enabled');
  console.log('Token blacklisting enabled');
});