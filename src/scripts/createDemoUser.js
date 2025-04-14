require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../api/models/user.model');
const { getDefaultPermissions } = require('../common/config/permissions'); // Import permission helper

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

    // Get default admin permissions
    const adminPermissions = getDefaultPermissions('admin');

    // Create demo user with permissions
    await User.create({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'password123', // Note: Password will be hashed by the pre-save hook in the model
      role: 'admin',
      permissions: adminPermissions, // Assign default admin permissions
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
