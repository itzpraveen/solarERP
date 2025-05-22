const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize'); // Import mongo-sanitize
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit'); // Commented out as not used
const path = require('path');
require('dotenv').config();

// Import configuration
const config = require('./common/config');

// Import error handler middleware
const errorHandler = require('./common/middleware/errorHandler');

// --- Preload Mongoose Models ---
// Ensure all models are registered before routes that might use them
require('./api/models/user.model');
require('./api/models/lead.model');
require('./api/models/customer.model');
require('./api/models/dealer.model'); // Assuming dealer model exists
require('./api/models/inventory.model');
require('./api/models/proposal.model');
require('./api/models/project.model');
require('./api/models/document.model');
require('./api/models/ServiceRequest'); // Assuming ServiceRequest model exists
require('./api/models/invoice.model'); // Register Invoice model
// Add any other models here if created later

// Import routes
const authRoutes = require('./modules/auth/auth.routes');
const leadRoutes = require('./api/routes/lead.routes');
const proposalRoutes = require('./api/routes/proposal.routes');
const customerRoutes = require('./api/routes/customer.routes');
const projectRoutes = require('./api/routes/project.routes');
const documentRoutes = require('./api/routes/document.routes');
const reportRoutes = require('./api/routes/report.routes');
const serviceRequestRoutes = require('./api/routes/service-request.routes');
const userRoutes = require('./api/routes/user.routes'); // Import user routes
const inventoryRoutes = require('./api/routes/inventory.routes'); // Import inventory routes
const invoiceRoutes = require('./api/routes/invoice.routes'); // Import invoice routes

// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet());
app.use(compression());

// Logger middleware
app.use(morgan('dev'));

// Rate limiting
// Define rate limiter but don't use it in development for ease of debugging
// Comment out the variable declaration since it's not used currently
/*
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});
*/

// Apply rate limiting to all API routes except authentication
/* Development: Temporarily disable rate limiting to avoid 429 errors during debugging
app.use('/api', (req, res, next) => {
  // Skip rate limiting for authentication routes
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  limiter(req, res, next);
});
*/

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// CORS configuration for development
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests from localhost:3000, localhost:3001, and the Railway frontend URL
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://solarerp-production.up.railway.app',
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true, // Allow cookies/authorization headers
    exposedHeaders: ['Content-Disposition'], // Expose header for filename access
  })
);

// Set Content-Security-Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' https://solarerp-production.up.railway.app http://localhost:5002 http://localhost:5003; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/users', userRoutes); // Mount user routes
app.use('/api/inventory', inventoryRoutes); // Mount inventory routes
app.use('/api/invoices', invoiceRoutes); // Mount invoice routes

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Ensure client build directory exists
  console.log(
    'Running in production mode, serving static files from:',
    path.join(__dirname, '../client-new/build')
  );

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client-new/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.url.startsWith('/api')) {
      return next();
    }
    return res.sendFile(
      path.resolve(__dirname, '../client-new/build', 'index.html')
    ); // Added return
  });
} else {
  // For development - respond with API information at root
  app.get('/', (req, res) => {
    res.json({
      message: 'SolarERP API - Use /api endpoints to access the API',
    });
  });
}

// Global error handler - Use the correct function from the imported object
app.use(errorHandler.globalErrorHandler);

// Database connection
mongoose
  .connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Running in development mode without MongoDB connection');
    // Don't exit the process in development mode
    if (config.server.env === 'production') {
      process.exit(1);
    }
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  if (config.server.env === 'production') {
    process.exit(1);
  }
});

module.exports = app;
