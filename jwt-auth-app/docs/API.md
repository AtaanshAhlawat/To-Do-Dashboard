# API Documentation

## Table of Contents
- [Authentication](#authentication)
  - [Register a New User](#register-a-new-user)
  - [Login](#login)
  - [Get Current User](#get-current-user)
  - [Refresh Token](#refresh-token)
  - [Logout](#logout)
  - [Forgot Password](#forgot-password)
  - [Reset Password](#reset-password)
- [Users](#users)
  - [Get All Users (Admin)](#get-all-users)
  - [Get User by ID](#get-user-by-id)
  - [Update User](#update-user)
  - [Delete User](#delete-user)
- [Error Handling](#error-handling)

## Authentication

### Register a New User

Register a new user account.

**URL**: `/api/auth/register`
**Method**: `POST`
**Authentication**: Not required

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (201 Created)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5f8d0f4d7f4e3a1b2c3d4e5f",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "User registered successfully"
}
```

**Error Responses**:
- 400 Bad Request: Missing required fields or invalid data
- 409 Conflict: Email or username already exists
- 500 Internal Server Error: Server error

### Login

Authenticate a user and get an access token.

**URL**: `/api/auth/login`
**Method**: `POST`
**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5f8d0f4d7f4e3a1b2c3d4e5f",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  },
  "message": "Login successful"
}
```

**Error Responses**:
- 400 Bad Request: Missing email or password
- 401 Unauthorized: Invalid credentials
- 500 Internal Server Error: Server error

### Get Current User

Get the currently authenticated user's profile.

**URL**: `/api/auth/me`
**Method**: `GET`
**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "5f8d0f4d7f4e3a1b2c3d4e5f",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**:
- 401 Unauthorized: No token provided or invalid token
- 404 Not Found: User not found
- 500 Internal Server Error: Server error

### Refresh Token

Get a new access token using a refresh token.

**URL**: `/api/auth/refresh-token`
**Method**: `POST`
**Authentication**: Not required

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "token": "new_access_token_here",
  "refreshToken": "new_refresh_token_here"
}
```

**Error Responses**:
- 400 Bad Request: No refresh token provided
- 401 Unauthorized: Invalid or expired refresh token
- 500 Internal Server Error: Server error

### Logout

Invalidate the current user's refresh token.

**URL**: `/api/auth/logout`
**Method**: `POST`
**Authentication**: Required (Bearer token)

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### Forgot Password

Request a password reset email.

**URL**: `/api/auth/forgot-password`
**Method**: `POST`
**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password

Reset a user's password using a reset token.

**URL**: `/api/auth/reset-password/:token`
**Method**: `PATCH`
**Authentication**: Not required

**Request Body**:
```json
{
  "password": "newSecurePassword123",
  "passwordConfirm": "newSecurePassword123"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Users

### Get All Users

Get a list of all users (Admin only).

**URL**: `/api/users`
**Method**: `GET`
**Authentication**: Required (Admin role)

**Success Response (200 OK)**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "5f8d0f4d7f4e3a1b2c3d4e5f",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    {
      "id": "6e9d1g5e8f2h0i3j4k5l6m7",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  ]
}
```

### Get User by ID

Get a user by their ID.

**URL**: `/api/users/:id`
**Method**: `GET`
**Authentication**: Required

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "5f8d0f4d7f4e3a1b2c3d4e5f",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update User

Update a user's information.

**URL**: `/api/users/:id`
**Method**: `PATCH`
**Authentication**: Required (User can update self, Admin can update any)

**Request Body**:
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "5f8d0f4d7f4e3a1b2c3d4e5f",
    "username": "newusername",
    "email": "newemail@example.com",
    "role": "user"
  },
  "message": "User updated successfully"
}
```

### Delete User

Delete a user account.

**URL**: `/api/users/:id`
**Method**: `DELETE`
**Authentication**: Required (User can delete self, Admin can delete any)

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Error Handling

All error responses follow the same format:

```json
{
  "success": false,
  "message": "Error message describing the issue",
  "error": "Detailed error information (in development only)",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Status Code | Description |
|------|-------------|-------------|
| `AUTH_ERROR` | 401 | Authentication failed |
| `UNAUTHORIZED` | 403 | Not authorized to access this resource |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_KEY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |

## Rate Limiting

The API implements rate limiting to prevent abuse. By default, clients are limited to 100 requests per 15 minutes. When the limit is exceeded, the API will respond with a 429 status code and the following JSON:

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

## Pagination

Endpoints that return lists of resources support pagination using the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10, max: 100)

Example: `/api/users?page=2&limit=5`

Pagination metadata is included in the response:

```json
{
  "success": true,
  "count": 25,
  "pagination": {
    "currentPage": 2,
    "totalPages": 5,
    "itemsPerPage": 5,
    "totalItems": 25,
    "hasNextPage": true,
    "hasPreviousPage": true,
    "nextPage": 3,
    "previousPage": 1
  },
  "data": [
    // items...
  ]
}
```

## Sorting

Endpoints that return lists of resources support sorting using the `sort` query parameter. The format is `field:order` where order can be `asc` or `desc`.

Example: `/api/users?sort=createdAt:desc`

## Filtering

Endpoints that return lists of resources support filtering by including field names and values as query parameters.

Example: `/api/users?role=admin&isActive=true`

## Field Selection

You can select which fields to include or exclude using the `select` query parameter. Use a comma-separated list of fields to include, or prefix fields with `-` to exclude them.

Example: `/api/users?select=username,email`
Example: `/api/users?select=-password,-__v`

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination metadata (if applicable)
  }
}
```

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the `Authorization` header:

```
Authorization: Bearer your_jwt_token_here
```

## Versioning

The API is versioned using the URL prefix. The current version is `v1`.

Example: `/api/v1/auth/login`

## CORS

Cross-Origin Resource Sharing (CORS) is enabled for the following origins by default:
- `http://localhost:3000`
- `http://localhost:5000`
- `https://yourapp.com`

You can configure allowed origins in the `.env` file using the `CORS_ORIGIN` variable.

## Webhooks

Coming soon...

## WebSocket

Coming soon...

## Changelog

### v1.0.0 (2023-01-01)
- Initial release
- User authentication
- Role-based access control
- Password reset functionality
