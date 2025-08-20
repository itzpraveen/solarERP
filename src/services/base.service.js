'use strict';

const { Op } = require('sequelize');
const AppError = require('../utils/appError');

/**
 * Base Service Class
 * Provides common CRUD operations for all services
 */
class BaseService {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Find all records with pagination and filtering
   */
  async findAll(options = {}) {
    const {
      where = {},
      include = [],
      order = [['created_at', 'DESC']],
      page = 1,
      limit = 20,
      attributes,
      distinct = true
    } = options;

    const offset = (page - 1) * limit;

    const result = await this.model.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset,
      attributes,
      distinct
    });

    return {
      data: result.rows,
      pagination: {
        total: result.count,
        page,
        limit,
        totalPages: Math.ceil(result.count / limit)
      }
    };
  }

  /**
   * Find a single record by ID
   */
  async findById(id, options = {}) {
    const { include = [], attributes } = options;

    const record = await this.model.findByPk(id, {
      include,
      attributes
    });

    if (!record) {
      throw new AppError(`${this.modelName} not found`, 404);
    }

    return record;
  }

  /**
   * Find a single record by criteria
   */
  async findOne(where, options = {}) {
    const { include = [], attributes } = options;

    const record = await this.model.findOne({
      where,
      include,
      attributes
    });

    return record;
  }

  /**
   * Create a new record
   */
  async create(data, options = {}) {
    const { transaction, returning = true } = options;

    const record = await this.model.create(data, {
      transaction,
      returning
    });

    return record;
  }

  /**
   * Update a record by ID
   */
  async update(id, data, options = {}) {
    const { transaction, returning = true } = options;

    const record = await this.findById(id);
    
    await record.update(data, {
      transaction,
      returning
    });

    return record;
  }

  /**
   * Delete a record by ID
   */
  async delete(id, options = {}) {
    const { transaction, force = false } = options;

    const record = await this.findById(id);

    if (force) {
      await record.destroy({ transaction, force: true });
    } else {
      // Soft delete if paranoid is enabled
      await record.destroy({ transaction });
    }

    return { success: true };
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data, options = {}) {
    const { transaction, returning = true, validate = true } = options;

    const records = await this.model.bulkCreate(data, {
      transaction,
      returning,
      validate
    });

    return records;
  }

  /**
   * Count records
   */
  async count(where = {}) {
    return await this.model.count({ where });
  }

  /**
   * Check if record exists
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Execute raw query
   */
  async executeQuery(query, options = {}) {
    const { type = 'SELECT', replacements = {}, transaction } = options;
    
    return await this.model.sequelize.query(query, {
      type: this.model.sequelize.QueryTypes[type],
      replacements,
      transaction
    });
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    return await this.model.sequelize.transaction();
  }

  /**
   * Build search criteria
   */
  buildSearchCriteria(searchTerm, searchFields) {
    if (!searchTerm || !searchFields || searchFields.length === 0) {
      return {};
    }

    const searchConditions = searchFields.map(field => {
      if (field.includes('.')) {
        // Handle nested fields
        const parts = field.split('.');
        return this.model.sequelize.where(
          this.model.sequelize.fn('lower', this.model.sequelize.col(field)),
          { [Op.like]: `%${searchTerm.toLowerCase()}%` }
        );
      } else {
        return this.model.sequelize.where(
          this.model.sequelize.fn('lower', this.model.sequelize.col(field)),
          { [Op.like]: `%${searchTerm.toLowerCase()}%` }
        );
      }
    });

    return { [Op.or]: searchConditions };
  }

  /**
   * Build date range criteria
   */
  buildDateRangeCriteria(startDate, endDate, field = 'created_at') {
    const criteria = {};
    
    if (startDate || endDate) {
      criteria[field] = {};
      if (startDate) {
        criteria[field][Op.gte] = new Date(startDate);
      }
      if (endDate) {
        criteria[field][Op.lte] = new Date(endDate);
      }
    }

    return criteria;
  }

  /**
   * Build sort configuration
   */
  buildSortConfig(sort, allowedFields = []) {
    if (!sort) {
      return [['created_at', 'DESC']];
    }

    const order = [];
    const sortItems = sort.split(',');

    sortItems.forEach(item => {
      const isDescending = item.startsWith('-');
      const field = isDescending ? item.slice(1) : item;
      
      // Check if field is allowed
      if (allowedFields.length === 0 || allowedFields.includes(field)) {
        order.push([field, isDescending ? 'DESC' : 'ASC']);
      }
    });

    return order.length > 0 ? order : [['created_at', 'DESC']];
  }
}

module.exports = BaseService;