const logger = require('./utils/logger');
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  try {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', { name: err.name, message: err.message, stack: err.stack });
  } catch (_) {
    // eslint-disable-next-line no-console
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  }
  process.exit(1);
});

const app = require('./server');

// Start the server
const port = process.env.PORT || 5002;
const server = app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated!');
  });
});
