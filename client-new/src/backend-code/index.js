const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
const leadRoutes = require('./routes/leadRoutes');
const customerRoutes = require('./routes/customerRoutes');
const projectRoutes = require('./routes/projectRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize app
const app = express();

// Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' })); // Increased limit for file uploads
app.use(cors());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/settings', settingsRoutes);

// Server static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client-new/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client-new/build/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

// Error handling middleware
app.use(errorHandler);

// Set port
const PORT = process.env.PORT || 5002;

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});