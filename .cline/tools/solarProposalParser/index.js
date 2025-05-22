const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');
const yup = require('yup');
const schemaJson = require('./schema.json'); // Load the schema

const app = express();
const PORT = 4010;

// --- Yup Schema Generation ---
// Helper to convert JSON schema properties to Yup schema
function buildYupSchema(properties, requiredFields) {
  const shape = {};
  for (const key in properties) {
    const prop = properties[key];
    let validator;
    switch (prop.type) {
      case 'string':
        validator = yup.string();
        if (prop.format === 'date') {
          // Basic date string validation, might need refinement
          validator = validator.matches(
            /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,
            'Invalid date format'
          );
        }
        if (prop.maxLength) {
          validator = validator.max(prop.maxLength);
        }
        break;
      case 'number':
        validator = yup.number();
        break;
      case 'integer':
        validator = yup.number().integer();
        break;
      case 'array':
        if (prop.items && prop.items.type === 'object') {
          validator = yup
            .array()
            .of(
              yup
                .object()
                .shape(
                  buildYupSchema(
                    prop.items.properties,
                    prop.items.required || []
                  )
                )
            );
        } else {
          // Handle other array types if needed
          validator = yup.array();
        }
        break;
      case 'object':
        validator = yup
          .object()
          .shape(buildYupSchema(prop.properties, prop.required || []));
        break;
      default:
        validator = yup.mixed();
    }
    if (requiredFields.includes(key)) {
      validator = validator.required(`${key} is required`);
    } else {
      // Make non-required fields optional but ensure they conform if present
      validator = validator.optional().nullable(); // Allow null/undefined for optional fields
    }
    shape[key] = validator;
  }
  return shape;
}

const solarProposalYupSchema = yup
  .object()
  .shape(buildYupSchema(schemaJson.properties, schemaJson.required));

// --- Placeholder Parsing Logic ---
// THIS IS A PLACEHOLDER - Needs actual implementation based on vendor formats
async function parseContentToSchema(rawContent, fileType) {
  console.log(`Attempting to parse ${fileType}...`);
  // TODO: Implement actual parsing logic based on expected PDF/XLSX structure
  // This might involve regex, keyword searching, or specific cell mapping for XLSX.
  // For now, return a dummy object that *might* pass validation if fields are correct type.

  const dummyData = {
    header: {
      client_name: 'Placeholder Client',
      site_address: 'Placeholder Address',
      capacity_kw: 10,
      inverter_kw: 8,
      proposal_date: new Date().toISOString().split('T')[0], // "YYYY-MM-DD"
      doc_ref_no: 'REF-' + Date.now(),
      company_name: 'Placeholder Vendor Inc.',
    },
    cost_breakup: {
      project_cost_excl_structure: 500000,
      structure_cost: 50000,
      final_project_cost: 550000,
      eligible_subsidy: 100000,
      net_investment_after_subsidy: 450000,
    },
    regulatory_fees: {
      kseb_fee_quoted: 15000,
      kseb_fee_refundable: 5000,
      kseb_formula: 'Placeholder Formula',
    },
    timeline: [
      { step: 'Site Survey', week_no: 1 },
      { step: 'Installation', week_no: 4 },
      { step: 'Commissioning', week_no: 6 },
    ],
    raw_text_excerpt:
      typeof rawContent === 'string'
        ? rawContent.substring(0, 500)
        : 'Raw content not available as string',
  };

  console.warn('Using PLACEHOLDER parsing logic. Needs implementation!');
  return dummyData;
}

// --- Express Setup ---
app.use(express.json());

app.post('/parse', async (req, res, next) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res
      .status(400)
      .json({ ok: false, error: 'Missing filePath in request body' });
  }

  // Basic security check: Ensure filePath is within an expected directory if needed
  // For now, we assume the path provided by the caller is safe/intended.
  // const absolutePath = path.resolve(filePath); // Consider resolving if relative paths are expected

  try {
    await fs.access(filePath); // Check if file exists and is accessible
    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();

    let rawContent;
    let fileType = 'unknown';

    if (fileExtension === '.pdf') {
      fileType = 'PDF';
      const data = await pdf(fileBuffer);
      rawContent = data.text;
      console.log(`Successfully parsed PDF: ${filePath}`);
    } else if (fileExtension === '.xlsx') {
      fileType = 'XLSX';
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      // Basic extraction: Get data from the first sheet as JSON
      // More sophisticated logic might be needed depending on XLSX structure
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rawContent = XLSX.utils.sheet_to_json(worksheet); // Or sheet_to_csv, etc.
      console.log(`Successfully parsed XLSX: ${filePath}`);
    } else {
      return res
        .status(400)
        .json({ ok: false, error: `Unsupported file type: ${fileExtension}` });
    }

    // --- Parsing and Validation ---
    const mappedData = await parseContentToSchema(rawContent, fileType);

    // Add raw excerpt if not already added by parser
    if (!mappedData.raw_text_excerpt && typeof rawContent === 'string') {
      mappedData.raw_text_excerpt = rawContent.substring(0, 500);
    } else if (!mappedData.raw_text_excerpt) {
      mappedData.raw_text_excerpt = 'Raw content excerpt unavailable.';
    }

    try {
      const validatedData = await solarProposalYupSchema.validate(mappedData, {
        abortEarly: false, // Collect all errors
        stripUnknown: true, // Remove fields not in schema
      });
      console.log(`Validation successful for: ${filePath}`);
      return res.json({ ok: true, data: validatedData });
    } catch (validationError) {
      console.error(
        `Validation failed for ${filePath}:`,
        validationError.errors
      );
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: validationError.errors,
        rawDataAttempted: mappedData, // Send back what was attempted
      });
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    if (error.code === 'ENOENT') {
      return res
        .status(404)
        .json({ ok: false, error: `File not found: ${filePath}` });
    }
    // Pass other errors to the generic error handler
    return next(error);
  }
});

// --- Generic Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res
    .status(500)
    .json({ ok: false, error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`MCP Solar Proposal Parser listening on port ${PORT}`);
});
