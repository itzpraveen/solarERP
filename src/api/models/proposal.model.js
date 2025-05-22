const mongoose = require('mongoose');
require('./inventory.model'); // Ensure Inventory model is registered before Proposal uses it

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
    projectType: {
      type: String,
      enum: ['Residential', 'Commercial'],
      required: [true, 'Project type is required'],
      default: 'Residential',
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
      // Base cost of system + installation
      type: Number,
      min: 0,
    },
    structureCost: {
      // Cost for mounting structure if applicable
      type: Number,
      default: 0,
      min: 0,
    },
    // finalProjectCost is now pre-GST cost
    finalProjectCost: {
      // (projectCostExcludingStructure + structureCost)
      type: Number,
      min: 0,
    },
    // GST Fields
    // Assuming intra-state for now (Kerala company, Kerala customer)
    // For solar components, GST might be complex (e.g. 70% components, 30% service, different rates)
    // Simplified: Apply a flat rate on (finalProjectCost - subsidyAmount) if subsidy is pre-tax
    // Or apply on finalProjectCost, then deduct subsidy. Let's assume subsidy is deducted from taxable value.
    taxableAmount: {
      // (finalProjectCost + additionalCosts) - subsidyAmount (if subsidy is pre-tax)
      type: Number,
      min: 0,
    },
    cgstRate: { type: Number, default: 0.09, min: 0 }, // Central GST Rate (e.g., 9%)
    sgstRate: { type: Number, default: 0.09, min: 0 }, // State GST Rate (e.g., 9%)
    igstRate: { type: Number, default: 0, min: 0 }, // Integrated GST Rate (for inter-state)
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstAmount: { type: Number, default: 0, min: 0 },
    igstAmount: { type: Number, default: 0, min: 0 },
    totalGstAmount: { type: Number, default: 0, min: 0 },

    totalAmountWithGST: {
      // finalProjectCost + totalGstAmount + additionalCosts (if additional costs are post-GST or non-taxable)
      // OR taxableAmount + totalGstAmount (if additional costs are part of taxable amount)
      // Let's assume additionalCosts are part of the taxable base for simplicity before subsidy.
      type: Number,
      min: 0,
    },
    subsidyAmount: {
      // Subsidy from government (e.g., PM Surya Ghar)
      type: Number,
      min: 0,
      default: 0,
    },
    netInvestment: {
      // Final amount payable by customer: totalAmountWithGST - subsidyAmount (if subsidy is post-tax)
      // OR taxableAmount (after subsidy) + totalGstAmount
      type: Number,
      min: 0,
    },
    additionalCosts: {
      // Costs like registration, specific fees not part of main system cost
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
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
          ref: 'Inventory',
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
proposalSchema.pre(/^find/, function addActiveFilter(next) {
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
proposalSchema.pre(/^find/, function populateReferences(next) {
  this.populate({
    path: 'lead',
    select: 'firstName lastName email phone address',
  }).populate({
    path: 'createdBy',
    select: 'firstName lastName email',
  });

  next();
});

// Calculate derived values and enforce subsidy rule before saving
proposalSchema.pre('save', function calculateDerivedValues(next) {
  // Enforce subsidy rule: Commercial projects must have 0 subsidy
  if (this.projectType === 'Commercial') {
    this.subsidyAmount = 0;
  }

  // Calculate Final Project Cost and Net Investment
  if (
    this.isModified('projectCostExcludingStructure') ||
    this.isModified('structureCost') ||
    this.isModified('additionalCosts') ||
    this.isModified('subsidyAmount') ||
    this.isModified('cgstRate') || // if rates can change per proposal
    this.isModified('sgstRate') ||
    this.isModified('igstRate') ||
    this.isModified('projectType')
  ) {
    const costA = this.projectCostExcludingStructure || 0;
    const costB = this.structureCost || 0;
    const additional = this.additionalCosts || 0;

    this.finalProjectCost = costA + costB; // This is pre-GST, pre-additional cost project value

    // Determine taxable amount. Let's assume subsidy reduces the base price before GST.
    // And additional costs are part of the taxable base.
    // This logic can be very specific to business rules.
    // Scenario 1: GST on (Project Cost + Additional Costs - Subsidy)
    let baseForTax = this.finalProjectCost + additional;
    if (this.subsidyAmount && this.subsidyAmount > 0) {
      // Option A: Subsidy reduces taxable value
      baseForTax -= this.subsidyAmount;
      // Option B: Subsidy is a post-tax deduction (would change logic below)
    }
    this.taxableAmount = Math.max(0, baseForTax); // Ensure non-negative

    // Calculate GST amounts
    // For now, assume intra-state (CGST+SGST). Logic for IGST vs CGST/SGST would depend on customer/company location.
    if (this.igstRate > 0) {
      // Inter-state
      this.cgstAmount = 0;
      this.sgstAmount = 0;
      this.igstAmount = this.taxableAmount * this.igstRate;
    } else {
      // Intra-state
      this.cgstAmount = this.taxableAmount * this.cgstRate;
      this.sgstAmount = this.taxableAmount * this.sgstRate;
      this.igstAmount = 0;
    }
    this.totalGstAmount = this.cgstAmount + this.sgstAmount + this.igstAmount;

    // Calculate total amount with GST
    this.totalAmountWithGST = this.taxableAmount + this.totalGstAmount;

    // Calculate Net Investment by customer
    // If subsidy was pre-tax (reduced taxableAmount), then netInvestment is totalAmountWithGST.
    // If subsidy is post-tax, then netInvestment is totalAmountWithGST - subsidy.
    // Assuming pre-tax subsidy for this calculation:
    this.netInvestment = this.totalAmountWithGST;
    // If subsidy was post-tax, it would be:
    // this.netInvestment = this.totalAmountWithGST - (this.subsidyAmount || 0);
    // This needs clarification based on actual business practice for solar subsidies in Kerala.
    // For PM Surya Ghar, subsidy is typically on system cost, so pre-tax reduction seems more likely.
  }

  next();
});

// Update status dates automatically
proposalSchema.pre('save', function updateStatusDates(next) {
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
