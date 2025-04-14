const mongoose = require('mongoose');
const { Schema } = mongoose; // Import Schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Customer',
    required: [true, 'Project must belong to a customer']
  },
  proposal: {
    type: mongoose.Schema.ObjectId,
    ref: 'Proposal'
  },
  status: {
    type: String,
    enum: [
      'active',
      'on_hold',
      'completed',
      'cancelled'
    ],
    default: 'active'
  },
  // Define sub-schema for tasks
  tasks: [
    {
      description: { type: String, required: true, trim: true },
      status: {
        type: String,
        enum: ['todo', 'in_progress', 'done', 'blocked'],
        default: 'todo',
      },
      assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
      dueDate: { type: Date },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  stage: {
    type: String,
    enum: [
      'planning',
      'permitting',
      'scheduled',
      'in_progress',
      'inspection',
      'completed'
    ],
    default: 'planning'
  },
  installAddress: {
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
  dates: {
    siteAssessment: Date,
    planningCompleted: Date,
    permitSubmitted: Date,
    permitApproved: Date,
    scheduledInstallation: Date,
    installationStarted: Date,
    installationCompleted: Date,
    inspectionScheduled: Date,
    inspectionCompleted: Date,
    utilityInterconnection: Date,
    systemActivation: Date,
    projectClosed: Date
  },
  team: {
    projectManager: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    salesRep: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    designer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    installationTeam: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }]
  },
  equipment: [{
    type: {
      type: String,
      required: [true, 'Equipment type is required'],
      enum: [
        'panel',
        'inverter',
        'battery',
        'optimizers',
        'racking',
        'monitoring',
        'other'
      ]
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required']
    },
    model: {
      type: String,
      required: [true, 'Model is required']
    },
    serialNumber: String,
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1
    },
    notes: String
  }],
  documents: [{
    type: {
      type: String,
      required: [true, 'Document type is required'],
      enum: [
        'permit',
        'contract',
        'design',
        'inspection',
        'utility',
        'warranty',
        'other'
      ]
    },
    name: {
      type: String,
      required: [true, 'Document name is required']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  notes: [{
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
  }],
  issues: [{
    title: {
      type: String,
      required: [true, 'Issue title is required']
    },
    description: {
      type: String,
      required: [true, 'Issue description is required']
    },
    priority: {
      type: String,
      enum: [
        'low',
        'medium',
        'high',
        'critical'
      ],
      default: 'medium'
    },
    status: {
      type: String,
      enum: [
        'open',
        'in_progress',
        'resolved',
        'closed'
      ],
      default: 'open'
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reportedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolutionNotes: String
  }],
  // Financial tracking
  financials: {
    totalContractValue: {
      type: Number,
      required: [true, 'Total contract value is required'],
      min: 0
    },
    paymentSchedule: [{
      name: {
        type: String,
        required: [true, 'Payment name is required']
      },
      amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: 0
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      dueDate: Date,
      paymentDate: Date,
      status: {
        type: String,
        enum: [
          'pending',
          'invoiced',
          'paid',
          'overdue'
        ],
        default: 'pending'
      },
      notes: String
    }],
    expenses: [{
      category: {
        type: String,
        required: [true, 'Expense category is required'],
        enum: [
          'equipment',
          'labor',
          'permits',
          'subcontractor',
          'other'
        ]
      },
      description: {
        type: String,
        required: [true, 'Expense description is required']
      },
      amount: {
        type: Number,
        required: [true, 'Expense amount is required'],
        min: 0
      },
      vendor: String,
      date: {
        type: Date,
        default: Date.now
      },
      notes: String,
      recordedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Expense recorder is required']
      }
    }]
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Project creator is required']
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
projectSchema.index({ customer: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ stage: 1 });
projectSchema.index({ 'team.projectManager': 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ 'dates.scheduledInstallation': 1 });

// Query middleware to only find active projects
projectSchema.pre(/^find/, function(next) {
  // Ensure the active filter is added without overwriting other conditions
  const currentQuery = this.getQuery();
  if (currentQuery.active === undefined) {
    this.where({ active: { $ne: false } });
    console.log('Project find middleware - Adding active filter: { active: { $ne: false } }');
  } else {
     console.log('Project find middleware - Active filter already present:', currentQuery.active);
  }
  next();
});

// Populate references
projectSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'customer',
    select: 'firstName lastName email phone address'
  })
  .populate({
    path: 'team.projectManager team.salesRep team.designer',
    select: 'firstName lastName email'
  });
  
  next();
});

// Calculate project financials before saving
projectSchema.pre('save', function(next) {
  // Calculate total expenses
  if (this.financials && this.financials.expenses && this.financials.expenses.length > 0) {
    this.financials.totalExpenses = this.financials.expenses.reduce(
      (total, expense) => total + expense.amount, 
      0
    );
  }
  
  // Calculate project profit
  if (this.financials && this.financials.totalContractValue && this.financials.totalExpenses) {
    this.financials.projectedProfit = this.financials.totalContractValue - this.financials.totalExpenses;
  }
  
  next();
});

// Auto-update stage dates
projectSchema.pre('save', function(next) {
  if (this.isModified('stage')) {
    const now = Date.now();
    
    switch (this.stage) {
      case 'planning':
        // No date update needed as it's the initial stage
        break;
      case 'permitting':
        if (!this.dates.planningCompleted) this.dates.planningCompleted = now;
        break;
      case 'scheduled':
        if (!this.dates.permitApproved) this.dates.permitApproved = now;
        break;
      case 'in_progress':
        if (!this.dates.installationStarted) this.dates.installationStarted = now;
        break;
      case 'inspection':
        if (!this.dates.installationCompleted) this.dates.installationCompleted = now;
        break;
      case 'completed':
        if (!this.dates.inspectionCompleted) this.dates.inspectionCompleted = now;
        if (!this.dates.systemActivation) this.dates.systemActivation = now;
        if (!this.dates.projectClosed) this.dates.projectClosed = now;
        // Also set status to completed
        this.status = 'completed';
        break;
      default:
        break;
    }
  }
  
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;