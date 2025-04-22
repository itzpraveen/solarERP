// Load environment variables FIRST
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const Inventory = require('../api/models/inventory.model'); // Adjust path if necessary
const config = require('../common/config'); // Now config should read the correct MONGODB_URI

const dummyItems = [
  {
    name: 'Dummy Solar Panel 450W',
    category: 'panel',
    quantity: 100, // Start with some quantity
    unitPrice: 15000, // Example price in INR
    supplier: 'Dummy Supplier Inc.',
    modelNumber: 'DSP-450',
    specifications: new Map([
      ['Wattage', '450W'],
      ['Efficiency', '21%'],
      ['Type', 'Monocrystalline'],
    ]),
  },
  {
    name: 'Dummy String Inverter 5kW',
    category: 'inverter',
    quantity: 50,
    unitPrice: 50000,
    supplier: 'Dummy Supplier Inc.',
    modelNumber: 'DSI-5K',
    specifications: new Map([
      ['Power Output', '5kW'],
      ['Max Efficiency', '98%'],
      ['Phases', 'Single'],
    ]),
  },
  {
    name: 'Dummy Mounting Rail',
    category: 'racking',
    quantity: 500,
    unitPrice: 500,
    supplier: 'Dummy Supplier Inc.',
    modelNumber: 'DMR-STD',
  },
];

const addDummyInventory = async () => {
  try {
    console.log('Connecting to database...');
    // Correct the path to the database URI
    await mongoose.connect(config.database.uri, {
      // useNewUrlParser: true, // Deprecated, remove if causing issues
      // useUnifiedTopology: true, // Deprecated, remove if causing issues
      // useCreateIndex: true, // Deprecated, remove if causing issues
      // useFindAndModify: false, // Deprecated, remove if causing issues
    });
    console.log('Database connected successfully.');

    console.log('Checking for existing dummy items...');
    const existingPanel = await Inventory.findOne({ modelNumber: 'DSP-450' });
    const existingInverter = await Inventory.findOne({ modelNumber: 'DSI-5K' });
    const existingRail = await Inventory.findOne({ modelNumber: 'DMR-STD' });

    const itemsToAdd = [];
    if (!existingPanel) itemsToAdd.push(dummyItems[0]);
    if (!existingInverter) itemsToAdd.push(dummyItems[1]);
    if (!existingRail) itemsToAdd.push(dummyItems[2]);

    if (itemsToAdd.length > 0) {
      console.log(`Adding ${itemsToAdd.length} new dummy inventory items...`);
      await Inventory.insertMany(itemsToAdd);
      console.log('Dummy inventory items added successfully.');
    } else {
      console.log('Dummy items already exist in the database. No items added.');
    }
  } catch (error) {
    console.error('Error adding dummy inventory:', error);
  } finally {
    console.log('Closing database connection...');
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

addDummyInventory();
