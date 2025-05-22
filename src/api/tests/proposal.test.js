const request = require('supertest');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs'); // Moved fs require to top
const app = require('../../server'); // Assuming your Express app is exported from server.js
const parserClient = require('../../../.cline/tools/solarProposalParser/client');

// --- Test Suite for Proposal Ingestion ---

describe('Proposal API Endpoints', () => {
  const dummyFilePath = path.resolve(
    __dirname,
    '../../../uploads/dummy-proposal.pdf'
  );
  const mockClientName = 'Mock Client from Test'; // For cleanup
  const hardcodedTestDocRefNo = 'MOCK-DOC-REF-123'; // Use a hardcoded value

  // Define the mock data structure at the describe level
  const mockParsedData = {
    ok: true,
    data: {
      header: {
        client_name: mockClientName,
        site_address: 'Mock Address',
        capacity_kw: 12,
        inverter_kw: 10,
        proposal_date: new Date().toISOString().split('T')[0],
        doc_ref_no: hardcodedTestDocRefNo, // Use hardcoded value
        company_name: 'Mock Vendor Inc.',
      },
      cost_breakup: {
        project_cost_excl_structure: 600000,
        structure_cost: 60000,
        final_project_cost: 660000,
        eligible_subsidy: 120000,
        net_investment_after_subsidy: 540000,
      },
      regulatory_fees: {
        kseb_fee_quoted: 16000,
        kseb_fee_refundable: 6000,
        kseb_formula: 'Mock Formula',
      },
      timeline: [
        { step: 'Mock Survey', week_no: 1 },
        { step: 'Mock Install', week_no: 5 },
      ],
      raw_text_excerpt: 'Mock raw excerpt...',
    },
  };

  // Mock the MCP parser client at the describe level
  jest.mock('../../../.cline/tools/solarProposalParser/client', () => ({
    parse: jest.fn().mockResolvedValue(mockParsedData), // Use the predefined mock data
  }));

  // --- Hooks ---
  afterAll(async () => {
    // Clean up the created test proposal using mongoose connection directly
    try {
      const ProposalModel = mongoose.model('Proposal');
      // Clean up using the hardcoded doc ref no as well, just in case
      await ProposalModel.deleteMany({
        $or: [
          { 'header.client_name': mockClientName },
          { 'header.doc_ref_no': hardcodedTestDocRefNo },
        ],
      });
      console.log(
        `Cleaned up test proposals for: ${mockClientName} / ${hardcodedTestDocRefNo}`
      );
    } catch (error) {
      console.error('Error cleaning up test proposal:', error);
    }
    // await mongoose.connection.close(); // Close connection if needed
  });

  // --- Test Cases ---

  describe('POST /api/proposals/upload', () => {
    // Reset modules before each test in this describe block if needed (might not be necessary now)
    // beforeEach(() => {
    //   jest.resetModules(); // May not be needed if mock is at describe level
    // });

    it('should upload a file, trigger parsing (mocked), ingest data, and return 201', async () => {
      // Require the client *inside* the test case

      // Make the request using supertest
      const response = await request(app)
        .post('/api/proposals/upload')
        .attach('file', dummyFilePath);

      // Assertions
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('header');
      // Assert against the hardcoded value used in the mock
      expect(response.body.data.header).toHaveProperty(
        'doc_ref_no',
        hardcodedTestDocRefNo
      );
      expect(response.body.data.header).toHaveProperty(
        'client_name',
        mockClientName
      );

      // Verify the parser mock was called
      expect(parserClient.parse).toHaveBeenCalled();
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app).post('/api/proposals/upload');

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message', 'No file uploaded.');
    });

    it('should return 400 if an unsupported file type is uploaded', async () => {
      const dummyTxtPath = path.resolve(
        __dirname,
        '../../../uploads/dummy-invalid.txt'
      );
      fs.writeFileSync(dummyTxtPath, 'invalid content'); // Use fs from top

      const response = await request(app)
        .post('/api/proposals/upload')
        .attach('file', dummyTxtPath);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Invalid file type. Only PDF and XLSX allowed.'
      );

      fs.unlinkSync(dummyTxtPath); // Use fs from top
    });
  });
});
