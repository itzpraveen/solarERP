class AppError extends Error {
  // Add an optional 'errors' parameter to store detailed validation errors
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as operational error

    // Store the detailed errors if provided
    if (errors) {
      this.errors = errors;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
