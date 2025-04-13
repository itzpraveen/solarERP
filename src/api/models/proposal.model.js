const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lead',
    required: [true, 'Proposal must belong to a lead']
  },
  name: {
    type: String,
    required: [true, 'Proposal name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: [
      'draft',
      'sent',
      'viewed',
      'accepted',
      'rejected',
      'expired'
    ],
    default: 'draft'
  },
  systemSize: {
    type: Number,
    required: [true, 'System size in kW is required'],
    min: 0
  },
  panelCount: {
    type: Number,
    required: [true, 'Number of panels is required'],
    min: 0
  },
  panelType: {
    type: String,
    required: [true, 'Panel type is required'],
    trim: true
  },
  inverterType: {
    type: String,
    required: [true, 'Inverter type is required'],
    trim: true
  },
  includesBattery: {
    type: Boolean,
    default: false
  },
  batteryType: String,
  batteryCount: {
    type: Number,
    default: 0
  },
  yearlyProductionEstimate: {
    type: Number,
    required: [true, 'Yearly production estimate in kWh is required'],
    min: 0
  },
  estimatedSavings: {
    firstYear: {
      type: Number,
      required: [true, 'First year savings estimate is required'],
      min: 0
    },
    twentyFiveYear: {
      type: Number,
      required: [true, 'Twenty-five year savings estimate is required'],
      min: 0
    }
  },
  pricing: {
    grossCost: {
      type: Number,
      required: [true, 'Gross system cost is required'],
      min: 0
    },
    federalTaxCredit: {
      type: Number,
      required: [true, 'Federal tax credit amount is required'],
      min: 0
    },
    stateTaxCredit: {
      type: Number,
      default: 0,
      min: 0
    },
    utilityRebate: {
      type: Number,
      default: 0,
      min: 0
    },
    otherIncentives: {
      type: Number,
      default: 0,
      min: 0
    },
    netCost: {
      type: Number,
      required: [true, 'Net system cost after incentives is required'],
      min: 0
    }
  },
  financingOptions: [
    {
      type: {
        type: String,
        required: [true, 'Financing type is required'],
        enum: [
          'cash',
          'loan',
          'lease',
          'ppa'
        ]
      },
      termYears: {
        type: Number,
        min: 0
      },
      downPayment: {
        type: Number,
        default: 0,
        min: 0
      },
      apr: {
        type: Number,
        min: 0
      },
      monthlyPayment: {
        type: Number,
        min: 0
      },
      totalCost: {
        type: Number,
        min: 0
      },
      selected: {
        type: Boolean,
        default: false
      }
    }
  ],
  designImages: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Proposal creator is required']
  },
  validUntil: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  notes: {
    type: String,
    trim: true
  },
  sentDate: Date,
  viewedDate: Date,
  acceptedDate: Date,
  rejectedDate: Date,
  active: {
    type: Boolean,
    default: true
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

// Indexes for common queries
proposalSchema.index({ lead: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdBy: 1 });
proposalSchema.index({ createdAt: -1 });

// Only query active proposals
proposalSchema.pre(/^find/, function(next) {
  // Ensure the active filter is added without overwriting other conditions
  const currentQuery = this.getQuery();
  if (currentQuery.active === undefined) {
    this.where({ active: { $ne: false } });
    console.log('Proposal find middleware - Adding active filter: { active: { $ne: false } }');
  } else {
     console.log('Proposal find middleware - Active filter already present:', currentQuery.active);
  }
  next();
});

// Populate references
proposalSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'lead',
    select: 'firstName lastName email phone address'
  }).populate({
    path: 'createdBy',
    select: 'firstName lastName email'
  });
  
  next();
});

// Calculate derived values before saving
proposalSchema.pre('save', function(next) {
  // Set net cost based on incentives if not provided
  if (!this.pricing.netCost) {
    this.pricing.netCost = this.pricing.grossCost - 
      this.pricing.federalTaxCredit - 
      this.pricing.stateTaxCredit - 
      this.pricing.utilityRebate - 
      this.pricing.otherIncentives;
  }
  
  next();
});

// Update status dates automatically
proposalSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case 'sent':
        this.sentDate = Date.now();
        break;
      case 'viewed':
        this.viewedDate = Date.now();
        break;
      case 'accepted':
        this.acceptedDate = Date.now();
        break;
      case 'rejected':
        this.rejectedDate = Date.now();
        break;
      default:
        break;
    }
  }
  
  next();
});

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;