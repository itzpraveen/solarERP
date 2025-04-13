const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
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
      default: 'USA',
      trim: true
    }
  },
  source: {
    type: String,
    required: [true, 'Lead source is required'],
    enum: [
      'website',
      'referral',
      'partner',
      'cold_call',
      'event',
      'social_media',
      'other'
    ]
  },
  status: {
    type: String,
    required: [true, 'Lead status is required'],
    enum: [
      'new',
      'contacted',
      'qualified',
      'proposal',
      'won',
      'lost',
      'inactive'
    ],
    default: 'new'
  },
  category: {
    type: String,
    enum: ['hot', 'warm', 'cold'],
    default: 'warm'
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
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
  interactions: [
    {
      type: {
        type: String,
        required: [true, 'Interaction type is required'],
        enum: [
          'email',
          'phone',
          'meeting',
          'site_visit',
          'proposal',
          'follow_up',
          'other'
        ]
      },
      date: {
        type: Date,
        required: [true, 'Interaction date is required'],
        default: Date.now
      },
      summary: {
        type: String,
        required: [true, 'Interaction summary is required']
      },
      conductedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'User who conducted the interaction is required']
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Lead creator is required']
  },
  estimatedSystemSize: {
    type: Number,
    min: 0
  },
  monthlyElectricBill: {
    type: Number,
    min: 0
  },
  propertyType: {
    type: String,
    enum: [
      'residential_single',
      'residential_multi',
      'commercial',
      'industrial',
      'agricultural',
      'other'
    ]
  },
  roofType: {
    type: String,
    enum: [
      'shingle',
      'metal',
      'tile',
      'flat',
      'other'
    ]
  },
  roofAge: {
    type: Number,
    min: 0
  },
  shading: {
    type: String,
    enum: [
      'none',
      'light',
      'moderate',
      'heavy'
    ]
  },
  active: {
    type: Boolean,
    default: true
  },
  converted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  nextFollowUp: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate proposals
leadSchema.virtual('proposals', {
  ref: 'Proposal',
  foreignField: 'lead',
  localField: '_id'
});

// Add indexes for common queries
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ category: 1 });
leadSchema.index({ 'address.zipCode': 1 });
leadSchema.index({ createdAt: -1 });

// Query middleware to only find active leads
leadSchema.pre(/^find/, function(next) {
  // Always filter out inactive leads
  const query = { active: { $ne: false } };
  
  console.log('Lead find middleware - Original conditions:', JSON.stringify(this._conditions));
  
  // Check if we're explicitly including converted leads
  // The controller sets includeConverted=true and removes the converted property
  // when we want to include converted leads
  
  if (this._conditions.includeConverted === 'true') {
    // If includeConverted is true, don't add the converted filter
    console.log('Lead find middleware - Including converted leads (not adding filter)');
  } else if ('converted' in this._conditions) {
    // If converted is already in the conditions, use that filter
    query.converted = this._conditions.converted;
    console.log('Lead find middleware - Using existing converted filter:', JSON.stringify(this._conditions.converted));
  } else {
    // Otherwise, add the default filter to exclude converted leads
    query.converted = { $ne: true };
    console.log('Lead find middleware - Adding default converted filter');
  }
  
  console.log('Lead find middleware - Final query:', JSON.stringify(query));
  this.find(query);
  next();
});

// Automatically populate assigned user
leadSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignedTo',
    select: 'firstName lastName email'
  });
  next();
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;