const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDB } = require('../../server'); // Import connectDB

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri; // Set URI for connectDB to use

  // console.log(`Jest setup (beforeAll): In-memory MongoDB URI set to ${mongoUri}`);
  
  // Now call the application's connectDB function
  try {
    await connectDB();
    // console.log('Jest setup (beforeAll): connectDB called successfully.');
  } catch (error) {
    console.error('Jest setup (beforeAll): Error calling connectDB:', error);
    // If connectDB fails, it might be critical, consider throwing to stop tests
    throw error;
  }
});

afterAll(async () => {
  // Disconnect mongoose using its own method, which is now managed via connectDB
  if (mongoose.connection.readyState !== 0) { 
    await mongoose.disconnect();
    // console.log('Jest setup (afterAll): Mongoose disconnected.');
  }
  
  // Stop the in-memory MongoDB server instance
  if (mongoServer) {
    await mongoServer.stop();
    // console.log('Jest setup (afterAll): In-memory MongoDB stopped.');
  }
});

// Optional: Clear all data between test suites if needed,
// though individual test cleanup is often preferred.
// beforeEach(async () => {
//   if (mongoose.connection.readyState === 1) { // 1 === connected
//     const collections = mongoose.connection.collections;
//     for (const key in collections) {
//       const collection = collections[key];
//       await collection.deleteMany({});
//     }
//   }
// });
