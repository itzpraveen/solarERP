'use strict';

const leadController = require('../../../controllers/lead.controller.new');
const leadService = require('../../../services/lead.service');
const AppError = require('../../../utils/appError');

// Mock the services
jest.mock('../../../services/lead.service');
jest.mock('../../../utils/logger');

describe('Lead Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup request, response, and next
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-123' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('getAllLeads', () => {
    it('should return all leads with pagination', async () => {
      const mockLeads = {
        data: [
          { id: '1', first_name: 'John', last_name: 'Doe' },
          { id: '2', first_name: 'Jane', last_name: 'Smith' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };

      leadService.getAllLeads.mockResolvedValue(mockLeads);

      await leadController.getAllLeads(req, res, next);

      expect(leadService.getAllLeads).toHaveBeenCalledWith({}, 'user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        ...mockLeads
      });
    });

    it('should pass query parameters to service', async () => {
      req.query = {
        page: 2,
        limit: 10,
        status: 'new',
        search: 'john'
      };

      const mockLeads = { data: [], pagination: {} };
      leadService.getAllLeads.mockResolvedValue(mockLeads);

      await leadController.getAllLeads(req, res, next);

      expect(leadService.getAllLeads).toHaveBeenCalledWith(req.query, 'user-123');
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      leadService.getAllLeads.mockRejectedValue(error);

      await leadController.getAllLeads(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getLead', () => {
    it('should return a single lead by ID', async () => {
      const mockLead = {
        id: 'lead-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      req.params.id = 'lead-123';
      leadService.getLeadById.mockResolvedValue(mockLead);

      await leadController.getLead(req, res, next);

      expect(leadService.getLeadById).toHaveBeenCalledWith('lead-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { lead: mockLead }
      });
    });

    it('should handle lead not found', async () => {
      req.params.id = 'nonexistent';
      const error = new AppError('Lead not found', 404);
      leadService.getLeadById.mockRejectedValue(error);

      await leadController.getLead(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createLead', () => {
    it('should create a new lead', async () => {
      const leadData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890'
      };

      const mockCreatedLead = {
        id: 'new-lead-123',
        ...leadData
      };

      req.body = leadData;
      leadService.createLead.mockResolvedValue(mockCreatedLead);

      await leadController.createLead(req, res, next);

      expect(leadService.createLead).toHaveBeenCalledWith(leadData, 'user-123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { lead: mockCreatedLead }
      });
    });

    it('should handle duplicate email error', async () => {
      req.body = { email: 'existing@example.com' };
      const error = new AppError('A lead with this email already exists', 400);
      leadService.createLead.mockRejectedValue(error);

      await leadController.createLead(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateLead', () => {
    it('should update an existing lead', async () => {
      const updateData = {
        status: 'contacted',
        notes: 'Follow up scheduled'
      };

      const mockUpdatedLead = {
        id: 'lead-123',
        first_name: 'John',
        last_name: 'Doe',
        status: 'contacted'
      };

      req.params.id = 'lead-123';
      req.body = updateData;
      leadService.updateLead.mockResolvedValue(mockUpdatedLead);

      await leadController.updateLead(req, res, next);

      expect(leadService.updateLead).toHaveBeenCalledWith('lead-123', updateData, 'user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { lead: mockUpdatedLead }
      });
    });
  });

  describe('deleteLead', () => {
    it('should delete a lead', async () => {
      req.params.id = 'lead-123';
      leadService.delete.mockResolvedValue({ success: true });

      await leadController.deleteLead(req, res, next);

      expect(leadService.delete).toHaveBeenCalledWith('lead-123');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: null
      });
    });
  });

  describe('convertToCustomer', () => {
    it('should convert lead to customer with proposal', async () => {
      req.params.id = 'lead-123';
      req.body = { proposalId: 'proposal-123' };

      const mockResult = {
        customer: { id: 'customer-123', email: 'john@example.com' },
        project: { id: 'project-123', name: 'Solar Installation' }
      };

      leadService.convertToCustomer.mockResolvedValue(mockResult);

      await leadController.convertToCustomer(req, res, next);

      expect(leadService.convertToCustomer).toHaveBeenCalledWith(
        'lead-123',
        'proposal-123',
        'user-123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult
      });
    });

    it('should return error if proposalId is missing', async () => {
      req.params.id = 'lead-123';
      req.body = {};

      await leadController.convertToCustomer(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Proposal ID is required');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('addLeadNote', () => {
    it('should add a note to a lead', async () => {
      req.params.id = 'lead-123';
      req.body = { content: 'This is a test note' };

      const mockNote = {
        id: 'note-123',
        lead_id: 'lead-123',
        content: 'This is a test note',
        created_by_id: 'user-123'
      };

      leadService.addNote.mockResolvedValue(mockNote);

      await leadController.addLeadNote(req, res, next);

      expect(leadService.addNote).toHaveBeenCalledWith(
        'lead-123',
        'This is a test note',
        'user-123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { note: mockNote }
      });
    });

    it('should return error if content is missing', async () => {
      req.params.id = 'lead-123';
      req.body = {};

      await leadController.addLeadNote(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Note content is required');
    });
  });

  describe('getLeadStats', () => {
    it('should return lead statistics', async () => {
      const mockStats = {
        totalLeads: 100,
        leadsByStatus: [
          { status: 'new', count: 30 },
          { status: 'contacted', count: 40 },
          { status: 'won', count: 30 }
        ],
        conversionRate: '30.00'
      };

      leadService.getStatistics.mockResolvedValue(mockStats);

      await leadController.getLeadStats(req, res, next);

      expect(leadService.getStatistics).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { stats: mockStats }
      });
    });
  });

  describe('bulkAssignLeads', () => {
    it('should bulk assign leads to a user', async () => {
      req.body = {
        leadIds: ['lead-1', 'lead-2', 'lead-3'],
        assignToUserId: 'user-456'
      };

      const mockResult = { updatedCount: 3 };
      leadService.bulkAssign.mockResolvedValue(mockResult);

      await leadController.bulkAssignLeads(req, res, next);

      expect(leadService.bulkAssign).toHaveBeenCalledWith(
        ['lead-1', 'lead-2', 'lead-3'],
        'user-456',
        'user-123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult
      });
    });

    it('should return error if leadIds is missing', async () => {
      req.body = { assignToUserId: 'user-456' };

      await leadController.bulkAssignLeads(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Lead IDs array is required');
    });

    it('should return error if assignToUserId is missing', async () => {
      req.body = { leadIds: ['lead-1'] };

      await leadController.bulkAssignLeads(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Assign to user ID is required');
    });
  });
});