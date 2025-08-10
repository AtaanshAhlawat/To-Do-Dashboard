# JWT Authentication API

A secure, production-ready JWT authentication API built with Node.js, Express, and MongoDB. This API provides user registration, login, password reset, and role-based access control (RBAC) functionality.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (RBAC)
- 🔄 Refresh token rotation
- ✉️ Password reset via email
- ⚡ Rate limiting
- 🛡️ Security best practices (helmet, CORS, etc.)
- 📊 Request logging
- ✅ Input validation
- 🧪 Test coverage
- 🔄 API versioning
- 📝 API documentation (Swagger/OpenAPI)

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Rate Limiting](#rate-limiting)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v7 or higher) or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/jwt-auth-api.git
   cd jwt-auth-api
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit the .env file with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The API will be available at `http://localhost:5000` by default.

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/jwt-auth-app

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRATION=7d

# Security
COOKIE_SECRET=your_cookie_secret
CORS_ORIGIN=http://localhost:3000

# Email Configuration (for password reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourapp.com
```

## API Documentation

For detailed API documentation, visit the [API Documentation](docs/API.md) or the interactive Swagger UI at `/api-docs` when the server is running.

## Authentication

### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

## Authorization

This API uses role-based access control (RBAC). The available roles are:

- `user`: Regular user (default)
- `admin`: Administrator with full access

To protect a route, use the `authenticate` middleware:

```javascript
import { authenticate, authorize } from '../middleware/authMiddleware';

// Protected route (any authenticated user)
router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

// Admin-only route
router.get('/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin dashboard' });
});
```

## Rate Limiting

The API includes rate limiting to prevent abuse. By default, it allows 100 requests per 15 minutes per IP address. You can configure this in the `.env` file:

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # 100 requests per window
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the server | `5000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/jwt-auth-app` |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRATION` | JWT expiration time | `1h` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

## Running Tests

To run the test suite:

```bash
npm test
# or
yarn test
```

## Deployment

### Production

1. Set `NODE_ENV=production` in your `.env` file
2. Build the application:
   ```bash
   npm run build
   ```
3. Start the production server:
   ```bash
   npm start
   ```

### Docker

1. Build the Docker image:
   ```bash
   docker build -t jwt-auth-api .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 --env-file .env jwt-auth-api
   ```

## Security

- Always use HTTPS in production
- Keep your JWT secrets secure and never commit them to version control
- Use strong passwords and password hashing
- Implement proper CORS policies
- Keep dependencies up to date
- Use rate limiting to prevent brute force attacks
- Validate all user input
- Use security headers (helmet middleware is included)

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add the necessary environment variables:
   ```
   DATABASE_URL=<your_database_url>
   JWT_SECRET=<your_jwt_secret>
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```

2. The server will run on `http://localhost:3000`.

## API Endpoints

### Authentication
- **POST /api/auth/register**
  - Register a new user.
  
- **POST /api/auth/login**
  - Log in an existing user and receive a JWT token.

### Dashboard
- **GET /api/dashboard**
  - Retrieve user-specific data. Requires authentication.

## License

This project is licensed under the MIT License.