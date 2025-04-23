const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lead',
      required: [true, 'Proposal must belong to a lead'],
    },
    name: {
      type: String,
      required: [true, 'Proposal name is required'],
      trim: true,
    },
    // Add Proposal ID field
    proposalId: {
      type: String,
      unique: true, // Assuming proposal IDs should be unique
      // Consider adding auto-generation logic if needed
      // required: [true, 'Proposal ID is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    systemSize: {
      type: Number,
      required: [true, 'System size in kW is required'],
      min: 0,
    },
    panelCount: {
      type: Number,
      required: [true, 'Number of panels is required'],
      min: 0,
    },
    energyMeter: {
      // Added field based on image
      type: String,
      trim: true,
    },
    // Removed yearlyProductionEstimate, estimatedSavings
    // Restructured pricing to match PDF
    projectCostExcludingStructure: {
      // Renamed from grossCost
      type: Number,
      // required: [true, 'Project cost (excluding structure) is required'], // Made optional
      min: 0,
    },
    structureCost: {
      // Added structure cost
      type: Number,
      default: 0,
      min: 0,
    },
    finalProjectCost: {
      // Added calculated field
      type: Number,
      min: 0,
    },
    subsidyAmount: {
      // Renamed from centralSubsidy
      type: Number,
      // required: [true, 'Subsidy amount is required'], // Made optional
      min: 0,
    },
    netInvestment: {
      // Added calculated field
      type: Number,
      min: 0,
    },
    additionalCosts: {
      // Added additional costs field
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      // Moved currency to top level
      type: String,
      default: 'INR',
      required: true,
    },
    // Re-add financing options
    financingOptions: [
      {
        type: {
          type: String,
          enum: ['cash', 'loan', 'lease', 'ppa'], // Example types
          required: true,
        },
        provider: String, // e.g., Bank Name
        termYears: Number,
        interestRate: Number, // APR
        downPayment: Number,
        monthlyPayment: Number,
        notes: String,
      },
    ],
    // Add line items
    lineItems: [
      {
        itemId: {
          type: mongoose.Schema.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        // Optional: Store name/model for easier display if needed,
        // but keep itemId as the source of truth
        // name: String,
        // modelNumber: String,
      },
    ],
    // Removed designImages
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Proposal creator is required'],
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    notes: {
      type: String,
      trim: true,
    },
    sentDate: Date,
    viewedDate: Date,
    acceptedDate: Date,
    rejectedDate: Date,
    active: {
      type: Boolean,
      default: true,
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
proposalSchema.index({ lead: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ createdBy: 1 });
proposalSchema.index({ createdAt: -1 });

// Only query active proposals
proposalSchema.pre(/^find/, function (next) {
  // Ensure the active filter is added without overwriting other conditions
  const currentQuery = this.getQuery();
  if (currentQuery.active === undefined) {
    this.where({ active: { $ne: false } });
    console.log(
      'Proposal find middleware - Adding active filter: { active: { $ne: false } }'
    );
  } else {
    console.log(
      'Proposal find middleware - Active filter already present:',
      currentQuery.active
    );
  }
  next();
});

// Populate references
proposalSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'lead',
    select: 'firstName lastName email phone address',
  }).populate({
    path: 'createdBy',
    select: 'firstName lastName email',
  });

  next();
});

// Calculate derived values before saving based on new structure
proposalSchema.pre('save', function (next) {
  // Calculate Final Project Cost and Net Investment
  if (
    this.isModified('projectCostExcludingStructure') ||
    this.isModified('structureCost') ||
    this.isModified('subsidyAmount')
  ) {
    const costA = this.projectCostExcludingStructure || 0;
    const costB = this.structureCost || 0;
    const subsidy = this.subsidyAmount || 0;

    this.finalProjectCost = costA + costB;
    this.netInvestment = this.finalProjectCost - subsidy;
  }

  next();
});

// Update status dates automatically
proposalSchema.pre('save', function (next) {
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
