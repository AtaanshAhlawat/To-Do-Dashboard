# To-Do Dashboard

A task management app I built with React, Node.js, and MongoDB. It handles authentication properly and includes some nice filtering features.

## What it does

- **Task management** - Create, edit, delete tasks with priorities and status
- **Excel-like filtering** - Sort and filter tasks by any column
- **User authentication** - JWT tokens with proper refresh handling
- **Responsive design** - Works on desktop and mobile
- **Real-time updates** - Changes sync immediately

## Security stuff

- Refresh tokens rotate on each use
- Server-side token invalidation on logout
- Token versioning to invalidate all sessions instantly
- Protected routes with proper validation
- Password hashing with bcrypt

## Getting Started

### What you need

- Node.js (v14+)
- MongoDB running locally
- npm or yarn

### Setup

1. **Clone and install:**

   ```bash
   git clone <your-repo-url>
   cd To-Do-Dashboard
   npm install
   cd backend && npm install && cd ..
   ```

2. **Environment setup:**

   ```bash
   cp .env.example backend/.env
   ```

3. **Generate secrets (important!):**

   ```bash
   openssl rand -base64 64  # JWT_SECRET
   openssl rand -base64 64  # JWT_REFRESH_SECRET
   ```

4. **Edit backend/.env:**

   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/todo-dashboard
   JWT_SECRET=your_generated_secret_here
   JWT_REFRESH_SECRET=your_generated_refresh_secret_here
   ```

5. **Run it:**

   ```bash
   # Terminal 1 - Backend
   cd backend && npm start

   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Open:**
   - Frontend: http://localhost:5173
   - API: http://localhost:3001

## Project Structure

```
To-Do-Dashboard/
├── backend/              # Express backend
│   ├── middleware/      # Auth & error handling
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API endpoints
│   └── server.js       # Server entry
├── src/                 # React frontend
│   ├── components/     # Reusable components
│   ├── store/         # Zustand state management
│   ├── utils/         # Helper functions
│   └── App.jsx        # Main app
├── SECURITY.md         # Security notes
└── README.md          # This file
```

## API Endpoints

### Auth

- `POST /api/register` - Sign up
- `POST /api/login` - Sign in
- `POST /api/refresh` - Get new access token
- `POST /api/logout` - Sign out
- `POST /api/logout-all` - Sign out everywhere
- `DELETE /api/delete-account` - Delete account

### Tasks

- `GET /api/tasks` - Get your tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Security

I've implemented proper security practices:

- Refresh tokens rotate on each use
- Token versioning to invalidate all sessions instantly
- Server-side token invalidation
- Input validation and sanitization

Check [SECURITY.md](./SECURITY.md) for more details.

## Development

### Tests

```bash
cd backend && npm test
npm test  # frontend
```

### Production build

```bash
npm run build
cd backend && npm run start:prod
```

## Deployment

### Production env vars

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_super_secure_jwt_secret
JWT_REFRESH_SECRET=your_super_secure_refresh_secret
CORS_ORIGIN=https://your-domain.com
```

### Production checklist

- [ ] Use HTTPS
- [ ] Set strong JWT secrets
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Consider httpOnly cookies

## Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file.

## Links

- **Live Demo**: [https://AtaanshAhlawat.github.io/To-Do](https://AtaanshAhlawat.github.io/To-Do)
- **Security Guide**: [SECURITY.md](./SECURITY.md)

---

Built with React, Node.js, and MongoDB
