require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../api/models/user.model');

const createDemoUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: 'demo@example.com' });
    if (existingUser) {
      console.log('Demo user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create demo user
    const demoUser = await User.create({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'password123',
      role: 'admin'
    });

    console.log('Demo user created successfully');
    console.log('Email: demo@example.com');
    console.log('Password: password123');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error creating demo user:', err);
    process.exit(1);
  }
};

createDemoUser();