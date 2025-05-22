const mongoose = require('mongoose');

const { Schema } = mongoose;

// Nested schema for header
const HeaderSchema = new Schema(
  {
    client_name: { type: String, required: true, trim: true },
    site_address: { type: String, required: true, trim: true },
    capacity_kw: { type: Number, required: true },
    inverter_kw: { type: Number, required: true },
    proposal_date: { type: Date, required: true }, // Store as Date object
    doc_ref_no: { type: String, required: true, unique: true, trim: true }, // Unique constraint
    company_name: { type: String, required: true, trim: true },
  },
  { _id: false }
); // No separate _id for subdocuments

// Nested schema for cost breakup
const CostBreakupSchema = new Schema(
  {
    project_cost_excl_structure: { type: Number, required: true },
    structure_cost: { type: Number, required: true },
    final_project_cost: { type: Number, required: true },
    eligible_subsidy: { type: Number, required: true },
    net_investment_after_subsidy: { type: Number, required: true },
  },
  { _id: false }
);

// Nested schema for regulatory fees
const RegulatoryFeesSchema = new Schema(
  {
    kseb_fee_quoted: { type: Number, required: true },
    kseb_fee_refundable: { type: Number, required: true },
    kseb_formula: { type: String, trim: true }, // Optional based on schema
  },
  { _id: false }
);

// Nested schema for timeline steps
const TimelineStepSchema = new Schema(
  {
    step: { type: String, required: true, trim: true },
    week_no: { type: Number, required: true, min: 1 }, // Integer, min 1 seems logical
  },
  { _id: false }
);

// Main Proposal Schema
const ProposalSchema = new Schema(
  {
    header: { type: HeaderSchema, required: true },
    cost_breakup: { type: CostBreakupSchema, required: true },
    regulatory_fees: { type: RegulatoryFeesSchema, required: true },
    timeline: { type: [TimelineStepSchema], required: true },
    raw_text_excerpt: { type: String, maxLength: 500, trim: true }, // Optional based on schema
    // Add any other top-level fields if needed in the future
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
    versionKey: false, // Disables the __v version key
  }
);

// Indexing common query fields can improve performance
// ProposalSchema.index({ 'header.doc_ref_no': 1 }); // Remove redundant index (unique:true already creates one)
ProposalSchema.index({ 'header.client_name': 1 });
ProposalSchema.index({ createdAt: -1 });

// Check if model already exists before defining to prevent OverwriteModelError in tests
module.exports =
  mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
