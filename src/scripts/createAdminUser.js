require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Exit gracefully if database configuration is not provided
if (!process.env.DB_HOST && !process.env.DB_NAME) {
  console.log('Skipping admin user creation: No database configuration provided');
  process.exit(0);
}

const db = require('../models');
const User = db.User;

const createAdminUser = async () => {
  try {
    // Connect to PostgreSQL
    await db.sequelize.authenticate();
    console.log('Connected to PostgreSQL');

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
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists`);
      await db.sequelize.close();
      return;
    }

    // Validate password strength
    if (adminPassword.length < 8) {
      console.error('Admin password must be at least 8 characters long');
      process.exit(1);
    }

    // Create admin user (password will be hashed by the model hook)
    const newAdmin = await User.create({
      email: adminEmail,
      password: adminPassword,
      firstName,
      lastName,
      role: 'admin',
      active: true,
      isVerified: true
    });
    console.log(`Admin user created successfully with email: ${adminEmail}`);
    
    // Security notice
    if (process.env.NODE_ENV === 'production') {
      console.log('\nIMPORTANT: Please change the admin password after first login!');
    }

    // Disconnect from PostgreSQL
    await db.sequelize.close();
    console.log('Disconnected from PostgreSQL');
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser();
