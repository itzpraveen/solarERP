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

// CORS
app.use(cors());

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
  app.use(express.static(path.join(__dirname, '../client-new/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client-new', 'build', 'index.html'));
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

// Start server
const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;