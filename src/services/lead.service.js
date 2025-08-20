'use strict';

const BaseService = require('./base.service');
const db = require('../models');
const AppError = require('../utils/appError');
const { cacheService, invalidateCache } = require('./cache.service');
const logger = require('../utils/logger');

const { Lead, LeadNote, LeadInteraction, User, Proposal } = db;

class LeadService extends BaseService {
  constructor() {
    super(Lead, 'Lead');
  }

  /**
   * Get all leads with filters and pagination
   */
  async getAllLeads(queryParams, userId) {
    const {
      page = 1,
      limit = 20,
      status,
      source,
      search,
      assignedTo,
      startDate,
      endDate,
      sort
    } = queryParams;

    // Build where clause
    let where = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedToId = assignedTo;

    // Add search criteria
    if (search) {
      const searchCriteria = this.buildSearchCriteria(search, [
        'first_name',
        'last_name',
        'email',
        'phone'
      ]);
      where = { ...where, ...searchCriteria };
    }

    // Add date range
    const dateRange = this.buildDateRangeCriteria(startDate, endDate);
    where = { ...where, ...dateRange };

    // Build sort configuration
    const order = this.buildSortConfig(sort, [
      'created_at',
      'updated_at',
      'first_name',
      'last_name',
      'status',
      'source'
    ]);

    // Cache key
    const cacheKey = `leads:list:${JSON.stringify({ where, page, limit, sort })}`;

    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached leads list');
      return cached;
    }

    // Fetch from database
    const result = await this.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order,
      page,
      limit
    });

    // Cache the result
    await cacheService.set(cacheKey, result, 60); // Cache for 1 minute

    logger.logRequest({ user: { id: userId } }, 'Fetched leads list', {
      count: result.data.length,
      page,
      limit
    });

    return result;
  }

  /**
   * Get single lead with all details
   */
  async getLeadById(id) {
    const cacheKey = `lead:${id}`;
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const lead = await this.findById(id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: LeadNote,
          as: 'notes',
          include: [
            {
              model: User,
              as: 'createdBy',
              attributes: ['id', 'firstName', 'lastName']
            }
          ],
          order: [['created_at', 'DESC']]
        },
        {
          model: LeadInteraction,
          as: 'interactions',
          include: [
            {
              model: User,
              as: 'conductedBy',
              attributes: ['id', 'firstName', 'lastName']
            }
          ],
          order: [['date', 'DESC']]
        },
        {
          model: Proposal,
          as: 'proposals',
          attributes: ['id', 'status', 'grossCost', 'createdAt']
        }
      ]
    });

    // Cache for 5 minutes
    await cacheService.set(cacheKey, lead, 300);

    return lead;
  }

  /**
   * Create a new lead
   */
  async createLead(leadData, userId) {
    const transaction = await this.beginTransaction();

    try {
      // Check for duplicate email
      const existing = await this.findOne({ email: leadData.email });
      if (existing) {
        throw new AppError('A lead with this email already exists', 400);
      }

      // Create lead
      const lead = await this.create({
        ...leadData,
        createdById: userId,
        status: leadData.status || 'new'
      }, { transaction });

      // Add initial note if provided
      if (leadData.notes) {
        await LeadNote.create({
          leadId: lead.id,
          text: leadData.notes,
          createdById: userId
        }, { transaction });
      }

      await transaction.commit();

      // Invalidate cache
      await invalidateCache(['leads:list:*', 'lead:stats:*']);

      logger.info('Lead created', {
        leadId: lead.id,
        userId,
        email: lead.email
      });

      return lead;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a lead
   */
  async updateLead(id, updateData, userId) {
    const transaction = await this.beginTransaction();

    try {
      // Check if email is being changed to an existing one
      if (updateData.email) {
        const existing = await this.findOne({
          email: updateData.email,
          id: { [db.Sequelize.Op.ne]: id }
        });
        if (existing) {
          throw new AppError('A lead with this email already exists', 400);
        }
      }

      // Update lead
      const lead = await this.update(id, {
        ...updateData,
        updatedById: userId
      }, { transaction });

      // Log status change
      if (updateData.status && updateData.status !== lead.status) {
        await LeadInteraction.create({
          leadId: id,
          type: 'other',
          summary: `Status changed from ${lead.status} to ${updateData.status}`,
          date: new Date(),
          conductedById: userId
        }, { transaction });
      }

      await transaction.commit();

      // Invalidate cache
      await invalidateCache([
        `lead:${id}`,
        'leads:list:*',
        'lead:stats:*'
      ]);

      logger.info('Lead updated', {
        leadId: id,
        userId,
        changes: Object.keys(updateData)
      });

      return lead;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Convert lead to customer
   */
  async convertToCustomer(leadId, proposalId, userId) {
    const transaction = await this.beginTransaction();

    try {
      const lead = await this.findById(leadId);
      
      if (lead.status === 'won') {
        throw new AppError('Lead has already been converted', 400);
      }

      // Check if proposal exists and is accepted
      const proposal = await db.Proposal.findByPk(proposalId);
      if (!proposal || proposal.leadId !== leadId) {
        throw new AppError('Invalid proposal', 400);
      }
      if (proposal.status !== 'accepted') {
        throw new AppError('Proposal must be accepted before converting lead', 400);
      }

      // Create customer
      const customer = await db.Customer.create({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        street: lead.street,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zipCode,
        country: lead.country,
        originalLeadId: leadId,
        acceptedProposalId: proposalId,
        createdById: userId
      }, { transaction });

      // Update lead status
      await lead.update({ status: 'won' }, { transaction });

      // Optionally create a project here if required by business logic.
      // Skipping project creation to avoid missing required fields.

      await transaction.commit();

      // Invalidate cache
      await invalidateCache([
        `lead:${leadId}`,
        'leads:list:*',
        'lead:stats:*',
        'customers:list:*'
      ]);

      logger.info('Lead converted to customer', {
        leadId,
        customerId: customer.id,
        userId
      });

      return { customer };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Add note to lead
   */
  async addNote(leadId, content, userId) {
    const lead = await this.findById(leadId);

    const note = await LeadNote.create({
      leadId: leadId,
      text: content,
      createdById: userId
    });

    // Invalidate cache
    await invalidateCache([`lead:${leadId}`]);

    return note;
  }

  /**
   * Add interaction to lead
   */
  async addInteraction(leadId, interactionData, userId) {
    const lead = await this.findById(leadId);

    const interaction = await LeadInteraction.create({
      leadId: leadId,
      ...interactionData,
      conductedById: userId
    });

    // Update lead's next follow-up date if provided
    if (interactionData.nextFollowUp) {
      await lead.update({ nextFollowUp: interactionData.nextFollowUp });
    }

    // Invalidate cache
    await invalidateCache([`lead:${leadId}`]);

    return interaction;
  }

  /**
   * Get lead statistics
   */
  async getStatistics(filters = {}) {
    const cacheKey = `lead:stats:${JSON.stringify(filters)}`;
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause for filters
    const where = {};
    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at[db.Sequelize.Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.created_at[db.Sequelize.Op.lte] = new Date(filters.endDate);
      }
    }

    // Get statistics
    const [
      totalLeads,
      leadsByStatus,
      leadsBySource,
      conversionRate,
      recentActivity
    ] = await Promise.all([
      // Total leads
      this.count(where),

      // Leads by status
      Lead.findAll({
        where,
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['status']
      }),

      // Leads by source
      Lead.findAll({
        where,
        attributes: [
          'source',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        group: ['source']
      }),

      // Conversion rate
      this.calculateConversionRate(where),

      // Recent activity
      LeadInteraction.findAll({
        include: [
          {
            model: Lead,
            as: 'lead',
            where,
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'conductedBy',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['date', 'DESC']],
        limit: 10
      })
    ]);

    const stats = {
      totalLeads,
      leadsByStatus,
      leadsBySource,
      conversionRate,
      recentActivity
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, stats, 300);

    return stats;
  }

  /**
   * Calculate conversion rate
   */
  async calculateConversionRate(where = {}) {
    const totalLeads = await this.count(where);
    const wonLeads = await this.count({ ...where, status: 'won' });
    
    return totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(2) : 0;
  }

  /**
   * Bulk assign leads
   */
  async bulkAssign(leadIds, assignToUserId, userId) {
    const transaction = await this.beginTransaction();

    try {
      // Verify user exists
      const assignee = await db.User.findByPk(assignToUserId);
      if (!assignee) {
        throw new AppError('Assignee user not found', 404);
      }

      // Update leads
      const [updatedCount] = await Lead.update(
        {
          assignedToId: assignToUserId,
          updatedById: userId
        },
        {
          where: { id: leadIds },
          transaction
        }
      );

      // Add interaction for each lead
      const interactions = leadIds.map(leadId => ({
        leadId: leadId,
        type: 'other',
        summary: `Assigned to ${assignee.firstName} ${assignee.lastName}`,
        date: new Date(),
        conductedById: userId
      }));

      await LeadInteraction.bulkCreate(interactions, { transaction });

      await transaction.commit();

      // Invalidate cache
      await invalidateCache(['leads:list:*', 'lead:stats:*']);
      for (const leadId of leadIds) {
        await invalidateCache([`lead:${leadId}`]);
      }

      logger.info('Bulk lead assignment completed', {
        leadIds,
        assignToUserId,
        userId,
        updatedCount
      });

      return { updatedCount };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Soft delete a lead by setting active=false
   */
  async delete(id) {
    const lead = await this.findById(id);
    await lead.update({ active: false });
    return { success: true };
  }
}

module.exports = new LeadService();
