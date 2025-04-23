const app = require('./server');

// Start the server
const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5002;
let server; // Declare server variable here

const startServer = (portArg) => {
  const port = Number(portArg);
  server = app.listen(port, () => {
    // Assign to the outer server variable
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`
    );
  });

  // Handle listen errors (e.g., port in use)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Port ${port} is in use, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error(
          `Port ${port} is already in use. Please free the port or set a different PORT.`
        );
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

// Start server with possible fallback on port conflict
startServer(DEFAULT_PORT);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated!');
  });
});
