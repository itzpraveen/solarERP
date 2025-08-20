'use strict';

const BaseService = require('./base.service');
const db = require('../models');
const AppError = require('../utils/appError');
const { cacheService, invalidateCache } = require('./cache.service');
const logger = require('../utils/logger');

const { Customer, Lead, Proposal, User, CustomerNote, Project } = db;

class CustomerService extends BaseService {
  constructor() {
    super(Customer, 'Customer');
  }

  /**
   * Get all customers with filters and pagination
   */
  async getAllCustomers(queryParams) {
    const {
      page = 1,
      limit = 20,
      search,
      active,
      startDate,
      endDate,
      sort
    } = queryParams;

    // Build where clause
    let where = {};

    if (active !== undefined) {
      where.active = active === 'true';
    }

    // Add search criteria
    if (search) {
      const searchCriteria = this.buildSearchCriteria(search, [
        'first_name',
        'last_name',
        'email',
        'phone',
        'company_name'
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
      'company_name'
    ]);

    const result = await this.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'projects',
          attributes: ['id', 'name', 'status', 'contract_amount']
        }
      ],
      order,
      page,
      limit
    });

    return result;
  }

  /**
   * Get customer with all details
   */
  async getCustomerById(id) {
    const customer = await this.findById(id, {
      include: [
        {
          model: Lead,
          as: 'originalLead',
          attributes: ['id', 'status', 'source', 'category']
        },
        {
          model: Proposal,
          as: 'acceptedProposal',
          attributes: ['id', 'system_size', 'panel_count', 'system_cost']
        },
        {
          model: Project,
          as: 'projects',
          include: [
            {
              model: User,
              as: 'projectManager',
              attributes: ['id', 'first_name', 'last_name']
            }
          ]
        },
        {
          model: CustomerNote,
          as: 'notes',
          include: [
            {
              model: User,
              as: 'createdBy',
              attributes: ['id', 'first_name', 'last_name']
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    return customer;
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData, userId) {
    const transaction = await this.beginTransaction();

    try {
      // Check for duplicate email
      const existing = await this.findOne({ email: customerData.email });
      if (existing) {
        throw new AppError('A customer with this email already exists', 400);
      }

      // Create customer
      const customer = await this.create({
        ...customerData,
        created_by_id: userId,
        active: true
      }, { transaction });

      // Add initial note if provided
      if (customerData.notes) {
        await CustomerNote.create({
          customer_id: customer.id,
          content: customerData.notes,
          created_by_id: userId
        }, { transaction });
      }

      await transaction.commit();

      // Invalidate cache
      await invalidateCache(['customers:list:*', 'customer:stats:*']);

      logger.info('Customer created', {
        customerId: customer.id,
        userId,
        email: customer.email
      });

      return customer;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(id, updateData, userId) {
    // Check if email is being changed to an existing one
    if (updateData.email) {
      const existing = await this.findOne({
        email: updateData.email,
        id: { [db.Sequelize.Op.ne]: id }
      });
      if (existing) {
        throw new AppError('A customer with this email already exists', 400);
      }
    }

    const customer = await this.update(id, {
      ...updateData,
      updated_by_id: userId
    });

    // Invalidate cache
    await invalidateCache([
      `customer:${id}`,
      'customers:list:*'
    ]);

    logger.info('Customer updated', {
      customerId: id,
      userId,
      changes: Object.keys(updateData)
    });

    return customer;
  }

  /**
   * Add note to customer
   */
  async addNote(customerId, content, userId) {
    const customer = await this.findById(customerId);

    const note = await CustomerNote.create({
      customer_id: customerId,
      content,
      created_by_id: userId
    });

    // Invalidate cache
    await invalidateCache([`customer:${customerId}`]);

    return note;
  }

  /**
   * Get customer statistics
   */
  async getStatistics() {
    const cacheKey = 'customer:stats';
    
    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      totalCustomers,
      activeCustomers,
      totalRevenue,
      averageProjectValue,
      customersByMonth
    ] = await Promise.all([
      // Total customers
      this.count(),

      // Active customers
      this.count({ active: true }),

      // Total revenue
      db.Project.sum('contract_amount'),

      // Average project value
      db.Project.findOne({
        attributes: [
          [db.sequelize.fn('AVG', db.sequelize.col('contract_amount')), 'avgValue']
        ]
      }),

      // Customers by month (last 6 months)
      Customer.findAll({
        attributes: [
          [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'month'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
        ],
        where: {
          created_at: {
            [db.Sequelize.Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        group: [db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at'))],
        order: [[db.sequelize.fn('DATE_TRUNC', 'month', db.sequelize.col('created_at')), 'ASC']]
      })
    ]);

    const stats = {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      totalRevenue: totalRevenue || 0,
      averageProjectValue: averageProjectValue?.dataValues?.avgValue || 0,
      customersByMonth
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, stats, 300);

    return stats;
  }

  /**
   * Get customer lifetime value
   */
  async getLifetimeValue(customerId) {
    const customer = await this.findById(customerId);

    const [
      totalProjects,
      totalRevenue,
      totalPaid,
      activeProjects
    ] = await Promise.all([
      // Total projects
      db.Project.count({ where: { customer_id: customerId } }),

      // Total revenue
      db.Project.sum('contract_amount', { where: { customer_id: customerId } }),

      // Total paid
      db.ProjectPayment.sum('amount', {
        include: [
          {
            model: db.Project,
            as: 'project',
            where: { customer_id: customerId }
          }
        ]
      }),

      // Active projects
      db.Project.count({
        where: {
          customer_id: customerId,
          status: ['planning', 'in_progress', 'installation']
        }
      })
    ]);

    return {
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        customerSince: customer.created_at
      },
      metrics: {
        totalProjects,
        activeProjects,
        totalRevenue: totalRevenue || 0,
        totalPaid: totalPaid || 0,
        outstandingBalance: (totalRevenue || 0) - (totalPaid || 0),
        averageProjectValue: totalProjects > 0 ? (totalRevenue || 0) / totalProjects : 0
      }
    };
  }
}

module.exports = new CustomerService();