const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  // Additional contact person (optional)
  secondaryContact: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  // Original lead that was converted to this customer
  originalLead: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lead',
    required: [true, 'Original lead reference is required']
  },
  // Accepted proposal that converted the lead to a customer
  acceptedProposal: {
    type: mongoose.Schema.ObjectId,
    ref: 'Proposal'
  },
  notes: [
    {
      text: {
        type: String,
        required: [true, 'Note text is required']
      },
      createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Note creator is required']
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  customerSince: {
    type: Date,
    default: Date.now
  },
  // Customer preferences
  communicationPreference: {
    type: String,
    enum: ['email', 'phone', 'text', 'mail'],
    default: 'email'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Customer creator is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for projects
customerSchema.virtual('projects', {
  ref: 'Project',
  foreignField: 'customer',
  localField: '_id'
});

// Indexes for common queries
customerSchema.index({ 'lastName': 1, 'firstName': 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ 'address.zipCode': 1 });
customerSchema.index({ customerSince: -1 });
customerSchema.index({ originalLead: 1 });

// Query middleware to only find active customers
customerSchema.pre(/^find/, function(next) {
  // Ensure the active filter is added without overwriting other conditions
  const currentQuery = this.getQuery();
  if (currentQuery.active === undefined) {
    this.where({ active: { $ne: false } });
    console.log('Customer find middleware - Adding active filter: { active: { $ne: false } }');
  } else {
     console.log('Customer find middleware - Active filter already present:', currentQuery.active);
  }
  next();
});

// Populate references
customerSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'createdBy',
    select: 'firstName lastName email'
  });
  
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;