const express = require('express');
const mongoose = require('mongoose');
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS with more permissive settings for production
app.use(cors({
  origin: '*', // In production you might want to restrict this
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Set Content-Security-Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' https://solarerp-production.up.railway.app http://localhost:5002; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
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
  const { statusCode = 500, message = 'Server Error' } = err;
  console.error(err.stack);
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
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