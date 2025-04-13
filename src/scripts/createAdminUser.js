require('dotenv').config();

// Exit gracefully if running in a container during build/install phase
if (
  process.env.NODE_ENV === 'production' &&
  process.env.MONGODB_URI === undefined
) {
  console.log(
    'Skipping admin user creation: Running in production without database connection'
  );
  process.exit(0);
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// const path = require('path'); // Removed unused path require
const User = require('../api/models/user.model'); // Require User model directly

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin credentials from environment variables or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@solarerp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists`);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const newAdmin = new User({
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin',
      isActive: true,
    });

    await newAdmin.save();
    console.log(
      `Admin user created with email: ${adminEmail} and password: ${adminPassword}`
    );

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser();
