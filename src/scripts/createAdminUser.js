require('dotenv').config();
const crypto = require('crypto');

const db = require('../models');
const User = db.User;

const createAdminUser = async () => {
  try {
    // Exit gracefully if database configuration is not provided
    if (!process.env.DB_HOST && !process.env.DB_NAME) {
      console.log('Skipping admin user creation: No database configuration provided');
      process.exit(0);
    }

    await db.sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Gather credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Generate if missing
    const finalEmail = adminEmail || `admin_${crypto.randomBytes(4).toString('hex')}@solarerp.local`;
    const finalPassword = adminPassword || crypto.randomBytes(16).toString('base64');
    const [firstName, ...lastNameParts] = adminName.split(' ');
    const lastName = lastNameParts.join(' ') || 'Administrator';

    // Check if exists
    const existingAdmin = await User.findOne({ where: { email: finalEmail.toLowerCase() } });
    if (existingAdmin) {
      console.log(`Admin user with email ${finalEmail} already exists`);
      await db.sequelize.close();
      return;
    }

    // Basic password constraint
    if (finalPassword.length < 8) {
      console.error('Admin password must be at least 8 characters long');
      process.exit(1);
    }

    // Create (model hooks hash password, lowercase email)
    await User.create({
      email: finalEmail,
      password: finalPassword,
      firstName,
      lastName,
      role: 'admin',
      active: true,
      isVerified: true
    });

    console.log('===========================================');
    console.log(`Admin user created successfully with email: ${finalEmail}`);
    if (!adminPassword) {
      console.log(`Generated password: ${finalPassword}`);
      console.log('Please save these credentials securely.');
    }
    console.log('===========================================');

    if (process.env.NODE_ENV === 'production') {
      console.log('\nIMPORTANT: Please change the admin password after first login!');
    }

    await db.sequelize.close();
    console.log('Disconnected from PostgreSQL');
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser();
