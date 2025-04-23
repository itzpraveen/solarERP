const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      street: {
        type: String,
        // required: [true, 'Street address is required'], // Made optional
        trim: true,
      },
      city: {
        type: String,
        // required: [true, 'City is required'], // Made optional
        trim: true,
      },
      district: {
        type: String,
        // required: [true, 'District is required'], // Made optional
        trim: true,
      },
      state: {
        type: String,
        // required: [true, 'State is required'], // Made optional
        trim: true,
      },
      zipCode: {
        type: String,
        // required: [true, 'ZIP code is required'], // Made optional
        trim: true,
      },
      country: {
        type: String,
        default: 'India',
        trim: true,
      },
    },
    source: {
      type: String,
      required: [true, 'Lead source is required'],
      enum: [
        'website',
        'dealer_referral', // Specific referral types
        'customer_referral',
        'staff_referral',
        'bni_referral',
        'google_page',
        'social_media_promo', // More specific than just social_media
        'partner', // Kept existing
        'cold_call', // Kept existing
        'event', // Kept existing
        'other', // Kept existing
      ],
    },
    // Fields to store the specific referrer based on the source type
    referringDealer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Dealer',
      required: [
        function () {
          return this.source === 'dealer_referral';
        },
        'Dealer reference is required for dealer referrals.',
      ],
    },
    referringCustomer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      required: [
        function () {
          return this.source === 'customer_referral';
        },
        'Customer reference is required for customer referrals.',
      ],
    },
    referringUser: {
      // For staff referrals
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [
        function () {
          return this.source === 'staff_referral';
        },
        'User reference is required for staff referrals.',
      ],
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
        'inactive',
      ],
      default: 'new',
    },
    category: {
      type: String,
      enum: ['hot', 'warm', 'cold'],
      default: 'warm',
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    notes: [
      {
        text: {
          type: String,
          required: [true, 'Note text is required'],
        },
        createdBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: [true, 'Note creator is required'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
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
            'other',
          ],
        },
        date: {
          type: Date,
          required: [true, 'Interaction date is required'],
          default: Date.now,
        },
        summary: {
          type: String,
          required: [true, 'Interaction summary is required'],
        },
        conductedBy: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: [true, 'User who conducted the interaction is required'],
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Lead creator is required'],
    },
    estimatedSystemSize: {
      type: Number,
      min: 0,
    },
    monthlyElectricBill: {
      amount: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
        required: true,
      },
    },
    propertyType: {
      type: String,
      enum: [
        'residential_single',
        'residential_multi',
        'commercial',
        'industrial',
        'agricultural',
        'other',
      ],
    },
    roofType: {
      type: String,
      enum: ['shingle', 'metal', 'tile', 'flat', 'other'],
    },
    roofAge: {
      type: Number,
      min: 0,
    },
    shading: {
      type: String,
      enum: ['none', 'light', 'moderate', 'heavy'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    converted: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    nextFollowUp: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate proposals
leadSchema.virtual('proposals', {
  ref: 'Proposal',
  foreignField: 'lead',
  localField: '_id',
});

// Add indexes for common queries
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ category: 1 });
leadSchema.index({ 'address.zipCode': 1 });
leadSchema.index({ createdAt: -1 });

// Query middleware to only find active leads
// Query middleware to only find active leads
leadSchema.pre(/^find/, function (next) {
  // Ensure the active filter is added without overwriting other conditions
  // Check if 'active' is already part of the query explicitly
  const currentQuery = this.getQuery();
  if (currentQuery.active === undefined) {
    // Add the active filter using $ne: false to include true and undefined
    this.where({ active: { $ne: false } });
    console.log(
      'Lead find middleware - Adding active filter: { active: { $ne: false } }'
    );
  } else {
    console.log(
      'Lead find middleware - Active filter already present in query:',
      currentQuery.active
    );
  }
  next();
});

// Automatically populate assigned user
leadSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'assignedTo',
    select: 'firstName lastName email',
  });
  next();
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
