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