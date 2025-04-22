const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['panel', 'inverter', 'battery', 'racking', 'wiring', 'other'], // Add more categories as needed
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      // Optional: Add supplier info
      type: String,
      trim: true,
    },
    modelNumber: {
      // Optional: Specific model number
      type: String,
      trim: true,
    },
    specifications: {
      // Optional: Store technical specs as an object
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
