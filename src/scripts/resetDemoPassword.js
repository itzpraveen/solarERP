require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../api/models/user.model');

const resetDemoPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const demoEmail = 'demo@example.com';
    const newPassword = 'password123'; // The password we want to set

    const user = await User.findOne({ email: demoEmail });

    if (!user) {
      console.log(`Demo user with email ${demoEmail} not found.`);
      await mongoose.disconnect();
      return;
    }

    console.log(`Found demo user: ${user.email}. Updating password...`);
    user.password = newPassword; // Set plain text password
    await user.save(); // Pre-save hook will hash it
    console.log(`Password for ${demoEmail} has been reset successfully.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error resetting demo user password:', err);
    await mongoose.disconnect(); // Ensure disconnection on error
    process.exit(1);
  }
};

resetDemoPassword();