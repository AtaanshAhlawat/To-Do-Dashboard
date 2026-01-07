// Centralized error handling middleware
// FIXED: Ensure proper error handler signature and handle all edge cases
module.exports = function errorHandler(err, req, res, next) {
  // Log the error
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Ensure res is a valid response object
  if (!res || typeof res.status !== 'function') {
    console.error('Invalid response object in error handler');
    return;
  }
  
  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Send error response
  const statusCode = err.status || err.statusCode || 500;
  const response = {
    error: err.message || "Internal Server Error",
    code: err.code || 'INTERNAL_SERVER_ERROR'
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};
