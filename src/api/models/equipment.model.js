const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Equipment type is required'],
      enum: [
        'panel',
        'inverter',
        'battery',
        'optimizer',
        'racking',
        'monitoring',
        'disconnect',
        'breaker',
        'wiring',
        'conduit',
        'other',
      ],
    },
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model number is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      // Common specs for all equipment
      weight: {
        value: Number,
        unit: {
          type: String,
          enum: ['kg', 'lb'],
          default: 'kg',
        },
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          enum: ['mm', 'cm', 'in'],
          default: 'cm',
        },
      },
      warranty: {
        years: Number,
        description: String,
      },

      // Panel specific specs
      panelPower: Number, // in Watts
      panelEfficiency: Number, // percentage
      cellType: {
        type: String,
        enum: [
          'monocrystalline',
          'polycrystalline',
          'thin_film',
          'bifacial',
          'other',
        ],
      },

      // Inverter specific specs
      inverterPower: Number, // in Watts
      inverterEfficiency: Number, // percentage
      inverterType: {
        type: String,
        enum: ['string', 'microinverter', 'hybrid', 'central', 'other'],
      },

      // Battery specific specs
      batteryCapacity: Number, // in kWh
      batteryVoltage: Number,
      batteryCycles: Number,
      batteryType: {
        type: String,
        enum: ['lithium_ion', 'lead_acid', 'salt_water', 'flow', 'other'],
      },

      // Other specs as needed
      otherSpecs: mongoose.Schema.Types.Mixed,
    },
    cost: {
      purchase: {
        type: Number,
        required: [true, 'Purchase cost is required'],
        min: 0,
      },
      installation: {
        type: Number,
        min: 0,
      },
      shipping: {
        type: Number,
        min: 0,
      },
    },
    pricing: {
      msrp: {
        type: Number,
        min: 0,
      },
      dealer: {
        type: Number,
        min: 0,
      },
      preferredCustomer: {
        type: Number,
        min: 0,
      },
    },
    inventory: {
      inStock: {
        type: Number,
        default: 0,
        min: 0,
      },
      allocated: {
        type: Number,
        default: 0,
        min: 0,
      },
      onOrder: {
        type: Number,
        default: 0,
        min: 0,
      },
      minimumStock: {
        type: Number,
        default: 5,
        min: 0,
      },
      location: String,
    },
    suppliers: [
      {
        name: {
          type: String,
          required: [true, 'Supplier name is required'],
        },
        contactPerson: String,
        email: String,
        phone: String,
        preferredSupplier: {
          type: Boolean,
          default: false,
        },
        leadTimeInDays: Number,
        notes: String,
      },
    ],
    compatibleProducts: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Equipment',
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    discontinued: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Equipment creator is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
equipmentSchema.index({ type: 1 });
equipmentSchema.index({ manufacturer: 1, model: 1 });
equipmentSchema.index({ 'inventory.inStock': 1 });
equipmentSchema.index({ discontinued: 1 });

// Query middleware to only find active equipment
equipmentSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Calculate total cost
equipmentSchema.virtual('totalCost').get(function () {
  let total = this.cost.purchase || 0;
  if (this.cost.installation) total += this.cost.installation;
  if (this.cost.shipping) total += this.cost.shipping;

  return total;
});

// Calculate total available stock
equipmentSchema.virtual('availableStock').get(function () {
  return (
    this.inventory.inStock - this.inventory.allocated + this.inventory.onOrder
  );
});

// Check if reordering is needed
equipmentSchema.virtual('needsReorder').get(function () {
  return (
    this.inventory.inStock - this.inventory.allocated <=
    this.inventory.minimumStock
  );
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;
