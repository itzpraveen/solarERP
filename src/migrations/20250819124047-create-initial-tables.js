'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Enable UUID extension for PostgreSQL
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create ENUM types
    await queryInterface.sequelize.query('CREATE TYPE "enum_users_role" AS ENUM(\'user\', \'admin\', \'manager\', \'sales\', \'installer\', \'finance\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_leads_source" AS ENUM(\'website\', \'referral\', \'partner\', \'cold_call\', \'event\', \'social_media\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_leads_status" AS ENUM(\'new\', \'contacted\', \'qualified\', \'proposal\', \'won\', \'lost\', \'inactive\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_leads_category" AS ENUM(\'hot\', \'warm\', \'cold\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_leads_property_type" AS ENUM(\'residential_single\', \'residential_multi\', \'commercial\', \'industrial\', \'agricultural\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_leads_roof_type" AS ENUM(\'shingle\', \'metal\', \'tile\', \'flat\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_leads_shading" AS ENUM(\'none\', \'light\', \'moderate\', \'heavy\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_customers_communication_preference" AS ENUM(\'email\', \'phone\', \'text\', \'mail\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_proposals_status" AS ENUM(\'draft\', \'sent\', \'viewed\', \'accepted\', \'rejected\', \'expired\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_proposal_financing_options_type" AS ENUM(\'cash\', \'loan\', \'lease\', \'ppa\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_projects_status" AS ENUM(\'active\', \'on_hold\', \'completed\', \'cancelled\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_projects_stage" AS ENUM(\'planning\', \'permitting\', \'scheduled\', \'in_progress\', \'inspection\', \'completed\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_equipment_type" AS ENUM(\'panel\', \'inverter\', \'battery\', \'optimizer\', \'racking\', \'monitoring\', \'disconnect\', \'breaker\', \'wiring\', \'conduit\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_project_equipment_type" AS ENUM(\'panel\', \'inverter\', \'battery\', \'optimizers\', \'racking\', \'monitoring\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_project_payments_status" AS ENUM(\'pending\', \'invoiced\', \'paid\', \'overdue\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_documents_type" AS ENUM(\'permit\', \'contract\', \'design\', \'proposal\', \'inspection\', \'utility\', \'warranty\', \'invoice\', \'customer\', \'marketing\', \'legal\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_documents_category" AS ENUM(\'project\', \'customer\', \'lead\', \'proposal\', \'equipment\', \'finance\', \'company\', \'employee\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_documents_related_entity_type" AS ENUM(\'project\', \'customer\', \'lead\', \'proposal\', \'equipment\', \'user\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_documents_storage_provider" AS ENUM(\'local\', \'s3\', \'gcs\', \'azure\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_documents_status" AS ENUM(\'draft\', \'active\', \'archived\', \'expired\', \'pending_approval\', \'approved\', \'rejected\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_service_requests_request_type" AS ENUM(\'maintenance\', \'repair\', \'installation\', \'inspection\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_service_requests_priority" AS ENUM(\'low\', \'medium\', \'high\', \'urgent\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_service_requests_status" AS ENUM(\'new\', \'assigned\', \'in_progress\', \'on_hold\', \'completed\', \'cancelled\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_lead_interactions_type" AS ENUM(\'email\', \'phone\', \'meeting\', \'site_visit\', \'proposal\', \'follow_up\', \'other\');');

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: 'enum_users_role',
        allowNull: false,
        defaultValue: 'user'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lock_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      zip_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      profile_picture: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create leads table
    await queryInterface.createTable('leads', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      street: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      zip_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'USA'
      },
      source: {
        type: 'enum_leads_source',
        allowNull: false
      },
      status: {
        type: 'enum_leads_status',
        allowNull: false,
        defaultValue: 'new'
      },
      category: {
        type: 'enum_leads_category',
        allowNull: false,
        defaultValue: 'warm'
      },
      assigned_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      estimated_system_size: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      monthly_electric_bill: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      property_type: {
        type: 'enum_leads_property_type',
        allowNull: true
      },
      roof_type: {
        type: 'enum_leads_roof_type',
        allowNull: true
      },
      roof_age: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      shading: {
        type: 'enum_leads_shading',
        allowNull: true
      },
      next_follow_up: {
        type: Sequelize.DATE,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create proposals table
    await queryInterface.createTable('proposals', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status: {
        type: 'enum_proposals_status',
        allowNull: false,
        defaultValue: 'draft'
      },
      system_size: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      panel_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      panel_type: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      inverter_type: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      includes_battery: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      battery_type: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      battery_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      yearly_production_estimate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      first_year_savings: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      twenty_five_year_savings: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      gross_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      federal_tax_credit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      state_tax_credit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      utility_rebate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      other_incentives: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      net_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      design_images: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sent_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      viewed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      accepted_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejected_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create customers table (requires leads and proposals to exist first)
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      street: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      zip_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'USA'
      },
      secondary_contact: {
        type: Sequelize.JSON,
        allowNull: true
      },
      original_lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      accepted_proposal_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'proposals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customer_since: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      communication_preference: {
        type: 'enum_customers_communication_preference',
        allowNull: false,
        defaultValue: 'email'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create projects table
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      proposal_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'proposals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: 'enum_projects_status',
        allowNull: false,
        defaultValue: 'active'
      },
      stage: {
        type: 'enum_projects_stage',
        allowNull: false,
        defaultValue: 'planning'
      },
      install_street: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      install_city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      install_state: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      install_zip_code: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      install_country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'USA'
      },
      system_size: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      panel_count: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      panel_type: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      inverter_type: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      includes_battery: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      battery_type: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      battery_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      site_assessment_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      planning_completed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      permit_submitted_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      permit_approved_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      scheduled_installation_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      installation_started_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      installation_completed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      inspection_scheduled_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      inspection_completed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      utility_interconnection_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      system_activation_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      project_closed_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      project_manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sales_rep_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      designer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      total_contract_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      total_expenses: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      projected_profit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create equipment table
    await queryInterface.createTable('equipment', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      type: {
        type: 'enum_equipment_type',
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      manufacturer: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      model: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specifications: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '{}'
      },
      purchase_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      installation_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      shipping_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      msrp: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      dealer_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      preferred_customer_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      in_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      allocated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      on_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      minimum_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      discontinued: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create documents table
    await queryInterface.createTable('documents', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: 'enum_documents_type',
        allowNull: false
      },
      category: {
        type: 'enum_documents_category',
        allowNull: false,
        defaultValue: 'other'
      },
      related_entity_type: {
        type: 'enum_documents_related_entity_type',
        allowNull: false
      },
      related_entity_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_extension: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      storage_provider: {
        type: 'enum_documents_storage_provider',
        allowNull: false,
        defaultValue: 'local'
      },
      status: {
        type: 'enum_documents_status',
        allowNull: false,
        defaultValue: 'active'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      public_access_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      share_expiration: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '{}'
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updated_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create service_requests table
    await queryInterface.createTable('service_requests', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      request_type: {
        type: 'enum_service_requests_request_type',
        allowNull: false
      },
      priority: {
        type: 'enum_service_requests_priority',
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: 'enum_service_requests_status',
        allowNull: false,
        defaultValue: 'new'
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assigned_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updated_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create junction/related tables

    // customer_notes table
    await queryInterface.createTable('customer_notes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // lead_notes table
    await queryInterface.createTable('lead_notes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // lead_interactions table
    await queryInterface.createTable('lead_interactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: 'enum_lead_interactions_type',
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      conducted_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // proposal_financing_options table
    await queryInterface.createTable('proposal_financing_options', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      proposal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'proposals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: 'enum_proposal_financing_options_type',
        allowNull: false
      },
      term_years: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      down_payment: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      apr: {
        type: Sequelize.DECIMAL(5, 3),
        allowNull: true
      },
      monthly_payment: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      total_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      selected: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_equipment table
    await queryInterface.createTable('project_equipment', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: 'enum_project_equipment_type',
        allowNull: false
      },
      manufacturer: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      model: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      serial_number: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_documents table (junction table)
    await queryInterface.createTable('project_documents', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_notes table
    await queryInterface.createTable('project_notes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_issues table
    await queryInterface.createTable('project_issues', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      severity: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open'
      },
      reported_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assigned_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_payments table
    await queryInterface.createTable('project_payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      payment_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: 'enum_project_payments_status',
        allowNull: false,
        defaultValue: 'pending'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_expenses table
    await queryInterface.createTable('project_expenses', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      vendor: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      receipt_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      approved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      approved_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      submitted_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // project_installation_team (many-to-many junction table)
    await queryInterface.createTable('project_installation_team', {
      project_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // equipment_suppliers table
    await queryInterface.createTable('equipment_suppliers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      contact_person: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      preferred_supplier: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      lead_time_in_days: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // equipment_compatibility (many-to-many self-referencing)
    await queryInterface.createTable('equipment_compatibility', {
      equipment_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      compatible_equipment_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // document_versions table
    await queryInterface.createTable('document_versions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      uploaded_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // document_access_controls table
    await queryInterface.createTable('document_access_controls', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission: {
        type: Sequelize.ENUM('read', 'write', 'admin'),
        allowNull: false,
        defaultValue: 'read'
      },
      granted_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      granted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // document_signatures table
    await queryInterface.createTable('document_signatures', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'documents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      signer_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      signer_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      signature_data: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      signed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // service_request_notes table
    await queryInterface.createTable('service_request_notes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      service_request_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'service_requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_by_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance optimization

    // Users table indexes
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['active']);
    await queryInterface.addIndex('users', ['last_login']);

    // Leads table indexes
    await queryInterface.addIndex('leads', ['last_name', 'first_name']);
    await queryInterface.addIndex('leads', ['email']);
    await queryInterface.addIndex('leads', ['status']);
    await queryInterface.addIndex('leads', ['assigned_to_id']);
    await queryInterface.addIndex('leads', ['created_by_id']);
    await queryInterface.addIndex('leads', ['category']);
    await queryInterface.addIndex('leads', ['zip_code']);
    await queryInterface.addIndex('leads', ['source']);
    await queryInterface.addIndex('leads', ['created_at']);
    await queryInterface.addIndex('leads', ['next_follow_up']);

    // Customers table indexes
    await queryInterface.addIndex('customers', ['last_name', 'first_name']);
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['zip_code']);
    await queryInterface.addIndex('customers', ['original_lead_id']);
    await queryInterface.addIndex('customers', ['accepted_proposal_id']);
    await queryInterface.addIndex('customers', ['created_by_id']);
    await queryInterface.addIndex('customers', ['customer_since']);

    // Proposals table indexes
    await queryInterface.addIndex('proposals', ['lead_id']);
    await queryInterface.addIndex('proposals', ['status']);
    await queryInterface.addIndex('proposals', ['created_by_id']);
    await queryInterface.addIndex('proposals', ['created_at']);
    await queryInterface.addIndex('proposals', ['valid_until']);
    await queryInterface.addIndex('proposals', ['sent_date']);
    await queryInterface.addIndex('proposals', ['accepted_date']);

    // Projects table indexes
    await queryInterface.addIndex('projects', ['customer_id']);
    await queryInterface.addIndex('projects', ['proposal_id']);
    await queryInterface.addIndex('projects', ['status']);
    await queryInterface.addIndex('projects', ['stage']);
    await queryInterface.addIndex('projects', ['project_manager_id']);
    await queryInterface.addIndex('projects', ['sales_rep_id']);
    await queryInterface.addIndex('projects', ['designer_id']);
    await queryInterface.addIndex('projects', ['created_by_id']);
    await queryInterface.addIndex('projects', ['scheduled_installation_date']);
    await queryInterface.addIndex('projects', ['created_at']);

    // Equipment table indexes
    await queryInterface.addIndex('equipment', ['type']);
    await queryInterface.addIndex('equipment', ['manufacturer', 'model']);
    await queryInterface.addIndex('equipment', ['in_stock']);
    await queryInterface.addIndex('equipment', ['discontinued']);
    await queryInterface.addIndex('equipment', ['created_by_id']);

    // Documents table indexes
    await queryInterface.addIndex('documents', ['name']);
    await queryInterface.addIndex('documents', ['type']);
    await queryInterface.addIndex('documents', ['category']);
    await queryInterface.addIndex('documents', ['related_entity_type', 'related_entity_id']);
    await queryInterface.addIndex('documents', ['status']);
    await queryInterface.addIndex('documents', ['created_by_id']);
    await queryInterface.addIndex('documents', ['updated_by_id']);
    await queryInterface.addIndex('documents', ['is_public']);
    await queryInterface.addIndex('documents', ['expires_at']);
    await queryInterface.addIndex('documents', ['created_at']);

    // Service requests table indexes
    await queryInterface.addIndex('service_requests', ['customer_id']);
    await queryInterface.addIndex('service_requests', ['project_id']);
    await queryInterface.addIndex('service_requests', ['assigned_to_id']);
    await queryInterface.addIndex('service_requests', ['status']);
    await queryInterface.addIndex('service_requests', ['priority']);
    await queryInterface.addIndex('service_requests', ['request_type']);
    await queryInterface.addIndex('service_requests', ['created_by_id']);
    await queryInterface.addIndex('service_requests', ['scheduled_date']);
    await queryInterface.addIndex('service_requests', ['created_at']);

    // Junction/related table indexes
    await queryInterface.addIndex('customer_notes', ['customer_id']);
    await queryInterface.addIndex('customer_notes', ['created_by_id']);
    await queryInterface.addIndex('customer_notes', ['created_at']);

    await queryInterface.addIndex('lead_notes', ['lead_id']);
    await queryInterface.addIndex('lead_notes', ['created_by_id']);
    await queryInterface.addIndex('lead_notes', ['created_at']);

    await queryInterface.addIndex('lead_interactions', ['lead_id']);
    await queryInterface.addIndex('lead_interactions', ['conducted_by_id']);
    await queryInterface.addIndex('lead_interactions', ['type']);
    await queryInterface.addIndex('lead_interactions', ['date']);

    await queryInterface.addIndex('proposal_financing_options', ['proposal_id']);
    await queryInterface.addIndex('proposal_financing_options', ['type']);
    await queryInterface.addIndex('proposal_financing_options', ['selected']);

    await queryInterface.addIndex('project_equipment', ['project_id']);
    await queryInterface.addIndex('project_equipment', ['type']);
    await queryInterface.addIndex('project_equipment', ['manufacturer', 'model']);

    await queryInterface.addIndex('project_documents', ['project_id']);
    await queryInterface.addIndex('project_documents', ['document_id']);
    await queryInterface.addIndex('project_documents', ['project_id', 'document_id'], { unique: true });

    await queryInterface.addIndex('project_notes', ['project_id']);
    await queryInterface.addIndex('project_notes', ['created_by_id']);
    await queryInterface.addIndex('project_notes', ['created_at']);

    await queryInterface.addIndex('project_issues', ['project_id']);
    await queryInterface.addIndex('project_issues', ['status']);
    await queryInterface.addIndex('project_issues', ['severity']);
    await queryInterface.addIndex('project_issues', ['reported_by_id']);
    await queryInterface.addIndex('project_issues', ['assigned_to_id']);

    await queryInterface.addIndex('project_payments', ['project_id']);
    await queryInterface.addIndex('project_payments', ['status']);
    await queryInterface.addIndex('project_payments', ['due_date']);
    await queryInterface.addIndex('project_payments', ['payment_date']);

    await queryInterface.addIndex('project_expenses', ['project_id']);
    await queryInterface.addIndex('project_expenses', ['category']);
    await queryInterface.addIndex('project_expenses', ['approved']);
    await queryInterface.addIndex('project_expenses', ['submitted_by_id']);
    await queryInterface.addIndex('project_expenses', ['date']);

    await queryInterface.addIndex('equipment_suppliers', ['equipment_id']);
    await queryInterface.addIndex('equipment_suppliers', ['name']);
    await queryInterface.addIndex('equipment_suppliers', ['preferred_supplier']);

    await queryInterface.addIndex('document_versions', ['document_id']);
    await queryInterface.addIndex('document_versions', ['version_number']);
    await queryInterface.addIndex('document_versions', ['uploaded_by_id']);
    await queryInterface.addIndex('document_versions', ['uploaded_at']);

    await queryInterface.addIndex('document_access_controls', ['document_id']);
    await queryInterface.addIndex('document_access_controls', ['user_id']);
    await queryInterface.addIndex('document_access_controls', ['permission']);
    await queryInterface.addIndex('document_access_controls', ['granted_by_id']);
    await queryInterface.addIndex('document_access_controls', ['document_id', 'user_id'], { unique: true });

    await queryInterface.addIndex('document_signatures', ['document_id']);
    await queryInterface.addIndex('document_signatures', ['signer_email']);
    await queryInterface.addIndex('document_signatures', ['signed_at']);

    await queryInterface.addIndex('service_request_notes', ['service_request_id']);
    await queryInterface.addIndex('service_request_notes', ['created_by_id']);
    await queryInterface.addIndex('service_request_notes', ['created_at']);

    // Add composite indexes for commonly queried combinations
    await queryInterface.addIndex('leads', ['status', 'assigned_to_id']);
    await queryInterface.addIndex('leads', ['category', 'status']);
    await queryInterface.addIndex('projects', ['status', 'stage']);
    await queryInterface.addIndex('projects', ['customer_id', 'status']);
    await queryInterface.addIndex('service_requests', ['customer_id', 'status']);
    await queryInterface.addIndex('service_requests', ['assigned_to_id', 'status']);

    // Add CHECK constraints
    await queryInterface.sequelize.query('ALTER TABLE leads ADD CONSTRAINT check_estimated_system_size CHECK (estimated_system_size >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE leads ADD CONSTRAINT check_monthly_electric_bill CHECK (monthly_electric_bill >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE leads ADD CONSTRAINT check_roof_age CHECK (roof_age >= 0);');

    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_system_size CHECK (system_size > 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_panel_count CHECK (panel_count > 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_battery_count CHECK (battery_count >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_yearly_production_estimate CHECK (yearly_production_estimate > 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_first_year_savings CHECK (first_year_savings >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_twenty_five_year_savings CHECK (twenty_five_year_savings >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_gross_cost CHECK (gross_cost > 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_federal_tax_credit CHECK (federal_tax_credit >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_state_tax_credit CHECK (state_tax_credit >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_utility_rebate CHECK (utility_rebate >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_other_incentives CHECK (other_incentives >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposals ADD CONSTRAINT check_net_cost CHECK (net_cost > 0);');

    await queryInterface.sequelize.query('ALTER TABLE projects ADD CONSTRAINT check_project_system_size CHECK (system_size > 0);');
    await queryInterface.sequelize.query('ALTER TABLE projects ADD CONSTRAINT check_project_panel_count CHECK (panel_count > 0);');
    await queryInterface.sequelize.query('ALTER TABLE projects ADD CONSTRAINT check_project_battery_count CHECK (battery_count >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE projects ADD CONSTRAINT check_total_contract_value CHECK (total_contract_value > 0);');
    await queryInterface.sequelize.query('ALTER TABLE projects ADD CONSTRAINT check_total_expenses CHECK (total_expenses >= 0);');

    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_purchase_cost CHECK (purchase_cost >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_installation_cost CHECK (installation_cost >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_shipping_cost CHECK (shipping_cost >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_msrp CHECK (msrp >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_dealer_price CHECK (dealer_price >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_preferred_customer_price CHECK (preferred_customer_price >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_in_stock CHECK (in_stock >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_allocated CHECK (allocated >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_on_order CHECK (on_order >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE equipment ADD CONSTRAINT check_minimum_stock CHECK (minimum_stock >= 0);');

    await queryInterface.sequelize.query('ALTER TABLE documents ADD CONSTRAINT check_file_size CHECK (file_size >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE documents ADD CONSTRAINT check_version CHECK (version >= 1);');

    await queryInterface.sequelize.query('ALTER TABLE project_equipment ADD CONSTRAINT check_quantity CHECK (quantity >= 1);');

    await queryInterface.sequelize.query('ALTER TABLE document_versions ADD CONSTRAINT check_version_number CHECK (version_number >= 1);');

    await queryInterface.sequelize.query('ALTER TABLE project_payments ADD CONSTRAINT check_payment_amount CHECK (amount > 0);');
    await queryInterface.sequelize.query('ALTER TABLE project_payments ADD CONSTRAINT check_percentage CHECK (percentage >= 0 AND percentage <= 100);');

    await queryInterface.sequelize.query('ALTER TABLE project_expenses ADD CONSTRAINT check_expense_amount CHECK (amount > 0);');

    await queryInterface.sequelize.query('ALTER TABLE proposal_financing_options ADD CONSTRAINT check_term_years CHECK (term_years >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposal_financing_options ADD CONSTRAINT check_down_payment CHECK (down_payment >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposal_financing_options ADD CONSTRAINT check_apr CHECK (apr >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposal_financing_options ADD CONSTRAINT check_monthly_payment CHECK (monthly_payment >= 0);');
    await queryInterface.sequelize.query('ALTER TABLE proposal_financing_options ADD CONSTRAINT check_total_cost CHECK (total_cost >= 0);');

    await queryInterface.sequelize.query('ALTER TABLE equipment_suppliers ADD CONSTRAINT check_lead_time_in_days CHECK (lead_time_in_days >= 0);');
  },

  async down (queryInterface, Sequelize) {
    // Drop all tables in reverse dependency order
    await queryInterface.dropTable('service_request_notes');
    await queryInterface.dropTable('document_signatures');
    await queryInterface.dropTable('document_access_controls');
    await queryInterface.dropTable('document_versions');
    await queryInterface.dropTable('equipment_compatibility');
    await queryInterface.dropTable('equipment_suppliers');
    await queryInterface.dropTable('project_installation_team');
    await queryInterface.dropTable('project_expenses');
    await queryInterface.dropTable('project_payments');
    await queryInterface.dropTable('project_issues');
    await queryInterface.dropTable('project_notes');
    await queryInterface.dropTable('project_documents');
    await queryInterface.dropTable('project_equipment');
    await queryInterface.dropTable('proposal_financing_options');
    await queryInterface.dropTable('lead_interactions');
    await queryInterface.dropTable('lead_notes');
    await queryInterface.dropTable('customer_notes');
    await queryInterface.dropTable('service_requests');
    await queryInterface.dropTable('documents');
    await queryInterface.dropTable('equipment');
    await queryInterface.dropTable('projects');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('proposals');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('users');

    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_lead_interactions_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_service_requests_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_service_requests_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_service_requests_request_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_storage_provider";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_related_entity_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_documents_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_payments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_equipment_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_equipment_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_projects_stage";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_projects_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_proposal_financing_options_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_proposals_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customers_communication_preference";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_shading";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_roof_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_property_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_leads_source";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};
