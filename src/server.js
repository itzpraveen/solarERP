const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./api/routes/auth.routes');
const leadRoutes = require('./api/routes/lead.routes');
const proposalRoutes = require('./api/routes/proposal.routes');
const customerRoutes = require('./api/routes/customer.routes');
const projectRoutes = require('./api/routes/project.routes');
const equipmentRoutes = require('./api/routes/equipment.routes');
const documentRoutes = require('./api/routes/document.routes');
const reportRoutes = require('./api/routes/report.routes');
const serviceRequestRoutes = require('./api/routes/service-request.routes');

// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Logger middleware
app.use(morgan('dev'));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests default
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.'
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgotPassword', authLimiter);

// Body parser with reasonable limits
app.use(express.json({ limit: '1mb' })); // Increased for file uploads and larger payloads
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Key'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Set Content-Security-Policy header based on environment
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "connect-src 'self' " + (process.env.API_URL || '') + "; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
  }
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/service-requests', serviceRequestRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Ensure client build directory exists
  console.log('Running in production mode, serving static files from:', path.join(__dirname, '../client-new/build'));
  
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client-new/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(__dirname, '../client-new/build', 'index.html'));
  });
} else {
  // For development - respond with API information at root
  app.get('/', (req, res) => {
    res.json({ message: 'SolarERP API - Use /api endpoints to access the API' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  let { statusCode = 500, message = 'Server Error' } = err;
  
  // Log error details for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', err);
  } else {
    console.error('Error:', message);
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: ' + Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry found';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: process.env.NODE_ENV === 'production' ? message : err.message || message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection (PostgreSQL via Sequelize)
const db = require('./models');

// Sync database
db.sequelize
  .authenticate()
  .then(() => {
    console.log('PostgreSQL connection has been established successfully.');
    
    // Sync models with database (use migrations in production)
    if (process.env.NODE_ENV !== 'production') {
      return db.sequelize.sync({ alter: true });
    }
  })
  .then(() => {
    console.log('Database models synchronized.');
  })
  .catch(err => {
    console.error('Unable to connect to the PostgreSQL database:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app;