'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Helper function to check if column exists
      const columnExists = async (tableName, columnName) => {
        const [results] = await queryInterface.sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND column_name = '${columnName}'
          AND table_schema = 'public'
        `);
        return results.length > 0;
      };

      // Helper function to check if index exists
      const indexExists = async (indexName) => {
        const [results] = await queryInterface.sequelize.query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND indexname = '${indexName}'
        `);
        return results.length > 0;
      };

      // Helper function to safely add index
      const safeAddIndex = async (tableName, columns, indexName, options = {}) => {
        // Check if index already exists
        if (await indexExists(indexName)) {
          console.log(`Index ${indexName} already exists, skipping...`);
          return;
        }

        // Check if all columns exist
        for (const column of columns) {
          if (!await columnExists(tableName, column)) {
            console.log(`Column ${column} does not exist in ${tableName}, skipping index ${indexName}`);
            return;
          }
        }

        // Add the index
        await queryInterface.addIndex(tableName, columns, {
          name: indexName,
          ...options
        });
        console.log(`Added index ${indexName} on ${tableName}(${columns.join(', ')})`);
      };

      // Add indexes
      console.log('Starting to add performance indexes...');

      // leads table indexes
      await safeAddIndex('leads', ['status'], 'idx_leads_status');
      await safeAddIndex('leads', ['assigned_to_id'], 'idx_leads_assigned_to');
      await safeAddIndex('leads', ['created_at'], 'idx_leads_created_at');
      await safeAddIndex('leads', ['email'], 'idx_leads_email');
      
      // customers table indexes  
      await safeAddIndex('customers', ['active'], 'idx_customers_active');
      await safeAddIndex('customers', ['created_at'], 'idx_customers_created_at');
      await safeAddIndex('customers', ['email'], 'idx_customers_email');
      
      // projects table indexes
      await safeAddIndex('projects', ['status'], 'idx_projects_status');
      await safeAddIndex('projects', ['customer_id'], 'idx_projects_customer');
      await safeAddIndex('projects', ['project_manager_id'], 'idx_projects_manager');
      await safeAddIndex('projects', ['start_date'], 'idx_projects_start_date');
      await safeAddIndex('projects', ['end_date'], 'idx_projects_end_date');
      
      // proposals table indexes
      await safeAddIndex('proposals', ['status'], 'idx_proposals_status');
      await safeAddIndex('proposals', ['lead_id'], 'idx_proposals_lead');
      await safeAddIndex('proposals', ['created_at'], 'idx_proposals_created_at');
      
      // service_requests table indexes
      await safeAddIndex('service_requests', ['status'], 'idx_service_requests_status');
      await safeAddIndex('service_requests', ['customer_id'], 'idx_service_requests_customer');
      await safeAddIndex('service_requests', ['priority'], 'idx_service_requests_priority');
      await safeAddIndex('service_requests', ['assigned_to_id'], 'idx_service_requests_assigned_to');
      
      // users table indexes
      await safeAddIndex('users', ['email'], 'idx_users_email');
      await safeAddIndex('users', ['role'], 'idx_users_role');
      await safeAddIndex('users', ['active'], 'idx_users_active');
      
      // documents table indexes
      await safeAddIndex('documents', ['entity_type', 'entity_id'], 'idx_documents_entity');
      await safeAddIndex('documents', ['uploaded_by_id'], 'idx_documents_uploaded_by');
      
      // equipment table indexes
      await safeAddIndex('equipment', ['category'], 'idx_equipment_category');
      await safeAddIndex('equipment', ['in_stock'], 'idx_equipment_in_stock');
      
      // project_equipment junction table indexes
      await safeAddIndex('project_equipment', ['project_id'], 'idx_project_equipment_project');
      await safeAddIndex('project_equipment', ['equipment_id'], 'idx_project_equipment_equipment');
      
      console.log('Performance indexes migration completed successfully');
    } catch (error) {
      console.error('Error adding indexes:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all indexes in reverse order
    const indexesToRemove = [
      'idx_project_equipment_equipment',
      'idx_project_equipment_project',
      'idx_equipment_in_stock',
      'idx_equipment_category',
      'idx_documents_uploaded_by',
      'idx_documents_entity',
      'idx_users_active',
      'idx_users_role',
      'idx_users_email',
      'idx_service_requests_assigned_to',
      'idx_service_requests_priority',
      'idx_service_requests_customer',
      'idx_service_requests_status',
      'idx_proposals_created_at',
      'idx_proposals_lead',
      'idx_proposals_status',
      'idx_projects_end_date',
      'idx_projects_start_date',
      'idx_projects_manager',
      'idx_projects_customer',
      'idx_projects_status',
      'idx_customers_email',
      'idx_customers_created_at',
      'idx_customers_active',
      'idx_leads_email',
      'idx_leads_created_at',
      'idx_leads_assigned_to',
      'idx_leads_status'
    ];
    
    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${indexName}`);
        console.log(`Removed index ${indexName}`);
      } catch (error) {
        console.log(`Error removing index ${indexName}:`, error.message);
      }
    }
  }
};