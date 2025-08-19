const express = require('express');
const db = require('./src/models');
const authController = require('./src/controllers/auth.controller');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL' });
});

// Auth routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authController.protect, authController.getMe);

// Test CRUD endpoints
app.get('/api/test/users', async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test/leads', async (req, res) => {
  try {
    const leads = await db.Lead.findAll();
    res.json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test/customers', async (req, res) => {
  try {
    const customers = await db.Customer.findAll();
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log('\n📝 Available endpoints:');
      console.log('  GET  /health');
      console.log('  POST /api/auth/signup');
      console.log('  POST /api/auth/login');
      console.log('  GET  /api/auth/me (protected)');
      console.log('  GET  /api/test/users');
      console.log('  GET  /api/test/leads');
      console.log('  GET  /api/test/customers\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();