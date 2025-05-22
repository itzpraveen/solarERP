const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'received', // Stock added (e.g., from supplier)
      'allocated', // Stock reserved for a project/order
      'committed', // Stock consumed by a project/order
      'released', // Reserved stock de-allocated
      'adjusted', // Manual stock adjustment
      'returned', // Stock returned from project or customer
      'initial', // Initial stock count when item created
    ],
  },
  quantityChange: {
    type: Number,
    required: true, // Positive for increase, negative for decrease
  },
  referenceDocument: {
    // E.g., Purchase Order ID, Project ID, Adjustment ID
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true, // Might be system-generated for some types
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

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
      enum: [
        'panel',
        'inverter',
        'battery',
        'racking',
        'wiring',
        'meter',
        'other',
      ], // Added 'meter'
      trim: true,
    },
    sku: {
      // Stock Keeping Unit
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple nulls if not all items have SKUs
    },
    quantity: {
      // Total physical quantity on hand
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedQuantity: {
      // Quantity reserved for projects/orders
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        // eslint-disable-next-line func-names
        validator(value) {
          // Reserved quantity cannot exceed total quantity
          return value <= this.quantity;
        },
        message: 'Reserved quantity cannot exceed total quantity on hand.',
      },
    },
    unitPrice: {
      // Cost price or standard price
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    supplier: {
      type: String, // Could be ObjectId ref if Supplier model exists
      trim: true,
    },
    modelNumber: {
      type: String,
      trim: true,
    },
    serialTracking: {
      // Boolean to indicate if individual serial numbers are tracked for this item
      type: Boolean,
      default: false,
    },
    // Array to store serial numbers if serialTracking is true and applicable
    // This is a simplified approach; a dedicated SerialNumber model might be better for large scale
    serialNumbers: [
      {
        serial: { type: String, unique: true, sparse: true },
        status: {
          type: String,
          enum: ['available', 'reserved', 'installed', 'defective', 'returned'],
          default: 'available',
        },
        projectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Project',
          sparse: true,
        }, // Link to project if installed/reserved
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    stockLog: [stockLogSchema],
    // Fields for reorder points and preferred stock levels
    reorderPoint: {
      type: Number,
      min: 0,
    },
    preferredStockLevel: {
      type: Number,
      min: 0,
    },
    // Location tracking (simplified, could be more complex)
    warehouseLocation: {
      type: String,
      trim: true,
    },
    active: {
      // To mark if the inventory item is currently active/used
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for available quantity
// eslint-disable-next-line func-names
inventorySchema.virtual('availableQuantity').get(function () {
  return this.quantity - this.reservedQuantity;
});

// Middleware to add an initial stock log entry when a new inventory item is created
// eslint-disable-next-line func-names
inventorySchema.pre('save', function (next) {
  if (this.isNew && this.quantity > 0) {
    this.stockLog.push({
      type: 'initial',
      quantityChange: this.quantity,
      notes: 'Initial stock count upon creation.',
      // createdBy: this.createdBy // If you have a createdBy field on inventory item itself
    });
  }
  // Ensure reservedQuantity does not exceed quantity
  if (this.reservedQuantity > this.quantity) {
    this.reservedQuantity = this.quantity; // Cap it, or throw error
  }
  next();
});

// Indexing
inventorySchema.index({ name: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ sku: 1 }, { unique: true, sparse: true }); // Ensure SKU is unique if provided
inventorySchema.index({ active: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
