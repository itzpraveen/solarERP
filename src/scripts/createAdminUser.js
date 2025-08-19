require('dotenv').config();
const crypto = require('crypto');

// Exit gracefully if running in a container during build/install phase
if (!process.env.DATABASE_URI && !process.env.MONGODB_URI) {
  console.log('Skipping admin user creation: No database connection string provided');
  process.exit(0);
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Check if user model is available in the current path
const userModelPath = path.join(__dirname, '../api/models/user.model');
let User;
try {
  User = require(userModelPath);
} catch (err) {
  console.error(`Error loading user model from ${userModelPath}:`, err);
  console.log('Attempting to load from alternative path...');
  try {
    User = require('../models/user.model');
  } catch (err) {
    console.error('Error loading user model from alternative path:', err);
    process.exit(1);
  }
}

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('No database URI found. Please set DATABASE_URI or MONGODB_URI environment variable.');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    
    // If no admin credentials provided, generate secure ones
    if (!adminEmail || !adminPassword) {
      const generatedEmail = `admin_${crypto.randomBytes(4).toString('hex')}@solarerp.local`;
      const generatedPassword = crypto.randomBytes(16).toString('base64');
      
      console.log('\n===========================================');
      console.log('IMPORTANT: No admin credentials provided.');
      console.log('Generating secure admin credentials:');
      console.log('===========================================');
      console.log(`Email: ${generatedEmail}`);
      console.log(`Password: ${generatedPassword}`);
      console.log('===========================================');
      console.log('Please save these credentials securely!');
      console.log('===========================================\n');
      
      // Use generated credentials
      const finalEmail = adminEmail || generatedEmail;
      const finalPassword = adminPassword || generatedPassword;
      const [firstName, ...lastNameParts] = adminName.split(' ');
      const lastName = lastNameParts.join(' ') || 'Administrator';
      
      // Create admin user with generated credentials
      const hashedPassword = await bcrypt.hash(finalPassword, 12);
      const newAdmin = new User({
        email: finalEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        isActive: true
      });

      await newAdmin.save();
      console.log(`Admin user created successfully with email: ${finalEmail}`);
      
      await mongoose.disconnect();
      return;
    }
    
    const [firstName, ...lastNameParts] = adminName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Administrator';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists`);
      await mongoose.disconnect();
      return;
    }

    // Validate password strength
    if (adminPassword.length < 8) {
      console.error('Admin password must be at least 8 characters long');
      process.exit(1);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const newAdmin = new User({
      email: adminEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      isActive: true
    });

    await newAdmin.save();
    console.log(`Admin user created successfully with email: ${adminEmail}`);
    
    // Security notice
    if (process.env.NODE_ENV === 'production') {
      console.log('\nIMPORTANT: Please change the admin password after first login!');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser();
