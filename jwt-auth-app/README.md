# JWT Authentication App

This project implements JWT authentication for user login, allowing each user to have their separate dashboard. 

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd jwt-auth-app
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