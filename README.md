# 📋 To-Do Dashboard

A secure, full-stack task management application with enterprise-grade JWT authentication and real-time updates.

## 🌟 Features

- 🔐 **Secure Authentication** - Enterprise-grade JWT with refresh token rotation
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ⚡ **Real-time Updates** - Instant task synchronization
- 🛡️ **Security First** - Token versioning, revocation, and comprehensive protection
- 🎨 **Modern UI** - Clean, intuitive interface built with React
- 🚀 **Fast Performance** - Optimized with Vite and modern tooling

## 🔒 Security Features

- ✅ Refresh token rotation (new token on every use)
- ✅ Server-side token revocation and invalidation
- ✅ Token versioning for instant logout from all devices
- ✅ Protected routes with comprehensive validation
- ✅ Secure password hashing with bcrypt
- ✅ Environment-based configuration management

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd To-Do-Dashboard
   ```

2. **Install dependencies:**

   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Set up environment variables:**

   ```bash
   # Copy the environment template
   cp .env.example backend/.env

   # Generate secure JWT secrets
   openssl rand -base64 64  # Use for JWT_SECRET
   openssl rand -base64 64  # Use for JWT_REFRESH_SECRET

   # Edit backend/.env with your values
   ```

4. **Configure your environment:**

   ```env
   # backend/.env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/todo-dashboard
   JWT_SECRET=your_generated_jwt_secret_here
   JWT_REFRESH_SECRET=your_generated_refresh_secret_here
   ```

5. **Start the application:**

   ```bash
   # Start backend (in one terminal)
   cd backend
   npm start

   # Start frontend (in another terminal)
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📁 Project Structure

```
To-Do-Dashboard/
├── backend/                 # Express.js backend
│   ├── middleware/         # Authentication & error handling
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   └── server.js          # Server entry point
├── src/                    # React frontend
│   ├── components/        # Reusable components
│   ├── store/            # Zustand state management
│   ├── utils/            # Utility functions
│   └── App.jsx           # Main application
├── SECURITY.md            # Security documentation
└── README.md             # This file
```

## 🔧 API Endpoints

### Authentication

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/refresh` - Refresh access token
- `POST /api/logout` - Logout (invalidate refresh token)
- `POST /api/logout-all` - Logout from all devices
- `DELETE /api/delete-account` - Delete user account

### Tasks

- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🛡️ Security

This application implements enterprise-grade security practices:

- **Refresh Token Rotation**: New tokens generated on every refresh
- **Token Versioning**: Ability to invalidate all user sessions instantly
- **Secure Storage**: Recommendations for production token storage
- **Strong Validation**: Comprehensive input validation and sanitization

For detailed security information, see [SECURITY.md](./SECURITY.md).

## 🔨 Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test
```

### Building for Production

```bash
# Build frontend
npm run build

# Start production server
cd backend
npm run start:prod
```

## 🌐 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret
CORS_ORIGIN=https://your-domain.com
```

### Security Checklist for Production

- [ ] Use HTTPS only
- [ ] Set strong, unique JWT secrets
- [ ] Configure CORS for your domain
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Consider using httpOnly cookies for tokens

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://AtaanshAhlawat.github.io/To-Do](https://AtaanshAhlawat.github.io/To-Do)
- **Security Guide**: [SECURITY.md](./SECURITY.md)
- **API Documentation**: Available in the `/api` endpoints

---

Built with ❤️ using React, Node.js, and MongoDB
