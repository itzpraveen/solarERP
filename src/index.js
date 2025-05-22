const { app, connectDB } = require('./server');
const config = require('./common/config'); // Import config for port

// Start the server
const DEFAULT_PORT = config.server.port; // Use port from config
let httpServer; // Renamed from server to avoid confusion with server.js module

const startHttpServer = (portArg) => {
  const port = Number(portArg);
  httpServer = app.listen(port, () => {
    console.log(
      `Server running in ${config.server.env} mode on port ${port}`
    );
  });

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (config.server.env !== 'production') {
        console.warn(`Port ${port} is in use, trying ${port + 1}`);
        startHttpServer(port + 1); // Recursive call to try next port
      } else {
        console.error(
          `Port ${port} is already in use. Production environment, exiting.`
        );
        process.exit(1);
      }
    } else {
      console.error('HTTP server error:', err);
      process.exit(1);
    }
  });
};

// Connect to DB then start HTTP server
connectDB()
  .then(() => {
    // Database connected, now start the HTTP server
    startHttpServer(DEFAULT_PORT);
  })
  .catch((err) => {
    console.error('Failed to connect to DB, server not started:', err);
    // process.exit(1) is already handled in connectDB for production
    // For non-production, connectDB rejects and we've logged the error here.
    // If not in production, the process won't exit from connectDB,
    // so ensure we exit here if that's the desired behavior for all envs on DB fail.
    if (config.server.env !== 'production') {
        process.exit(1); // Exit if DB connection fails in dev/test too
    }
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed.');
      // Disconnect Mongoose connection if open
      if (mongoose.connection.readyState === 1) {
        mongoose.disconnect(() => {
          console.log('MongoDB connection closed due to SIGTERM.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0); // If server never started
  }
});
