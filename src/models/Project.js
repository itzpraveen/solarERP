'use strict';

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Project name is required'
        }
      }
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    proposalId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'proposals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    status: {
      type: DataTypes.ENUM(
        'active',
        'on_hold',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'active'
    },
    stage: {
      type: DataTypes.ENUM(
        'planning',
        'permitting',
        'scheduled',
        'in_progress',
        'inspection',
        'completed'
      ),
      allowNull: false,
      defaultValue: 'planning'
    },
    // Install address fields
    installStreet: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Street address is required'
        }
      }
    },
    installCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'City is required'
        }
      }
    },
    installState: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'State is required'
        }
      }
    },
    installZipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'ZIP code is required'
        }
      }
    },
    installCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'USA'
    },
    // System specifications
    systemSize: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'System size must be positive'
        },
        notEmpty: {
          msg: 'System size in kW is required'
        }
      }
    },
    panelCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Panel count must be positive'
        },
        notEmpty: {
          msg: 'Number of panels is required'
        }
      }
    },
    panelType: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Panel type is required'
        }
      }
    },
    inverterType: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Inverter type is required'
        }
      }
    },
    includesBattery: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    batteryType: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    batteryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Battery count must be non-negative'
        }
      }
    },
    // Important dates
    siteAssessmentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    planningCompletedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permitSubmittedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permitApprovedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledInstallationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    installationStartedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    installationCompletedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    inspectionScheduledDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    inspectionCompletedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    utilityInterconnectionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    systemActivationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    projectClosedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Team assignments
    projectManagerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    salesRepId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    designerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    // Financial tracking
    totalContractValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Total contract value must be positive'
        },
        notEmpty: {
          msg: 'Total contract value is required'
        }
      }
    },
    totalExpenses: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Total expenses must be non-negative'
        }
      }
    },
    projectedProfit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (project) => {
        // Calculate projected profit
        if (project.totalContractValue && project.totalExpenses) {
          project.projectedProfit = project.totalContractValue - project.totalExpenses;
        }
      },
      beforeUpdate: (project) => {
        // Auto-update stage dates when stage changes
        if (project.changed('stage')) {
          const now = new Date();
          
          switch (project.stage) {
            case 'permitting':
              if (!project.planningCompletedDate) project.planningCompletedDate = now;
              break;
            case 'scheduled':
              if (!project.permitApprovedDate) project.permitApprovedDate = now;
              break;
            case 'in_progress':
              if (!project.installationStartedDate) project.installationStartedDate = now;
              break;
            case 'inspection':
              if (!project.installationCompletedDate) project.installationCompletedDate = now;
              break;
            case 'completed':
              if (!project.inspectionCompletedDate) project.inspectionCompletedDate = now;
              if (!project.systemActivationDate) project.systemActivationDate = now;
              if (!project.projectClosedDate) project.projectClosedDate = now;
              project.status = 'completed';
              break;
          }
        }
      }
    },
    defaultScope: {
      where: { active: true }
    },
    scopes: {
      includeInactive: {
        where: {}
      }
    },
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['stage']
      },
      {
        fields: ['project_manager_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['scheduled_installation_date']
      },
      {
        fields: ['created_by_id']
      }
    ]
  });

  // Associations
  Project.associate = function(models) {
    // Belongs to relationships
    Project.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    
    Project.belongsTo(models.Proposal, {
      foreignKey: 'proposalId',
      as: 'proposal'
    });
    
    Project.belongsTo(models.User, {
      foreignKey: 'projectManagerId',
      as: 'projectManager'
    });
    
    Project.belongsTo(models.User, {
      foreignKey: 'salesRepId',
      as: 'salesRep'
    });
    
    Project.belongsTo(models.User, {
      foreignKey: 'designerId',
      as: 'designer'
    });
    
    Project.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });

    // Many-to-many relationship with installation team
    Project.belongsToMany(models.User, {
      through: 'project_installation_team',
      foreignKey: 'projectId',
      otherKey: 'userId',
      as: 'installationTeam'
    });

    // Has many relationships
    Project.hasMany(models.ProjectEquipment, {
      foreignKey: 'projectId',
      as: 'equipment'
    });

    Project.hasMany(models.ProjectDocument, {
      foreignKey: 'projectId',
      as: 'documents'
    });

    Project.hasMany(models.ProjectNote, {
      foreignKey: 'projectId',
      as: 'notes'
    });

    Project.hasMany(models.ProjectIssue, {
      foreignKey: 'projectId',
      as: 'issues'
    });

    Project.hasMany(models.ProjectPayment, {
      foreignKey: 'projectId',
      as: 'payments'
    });

    Project.hasMany(models.ProjectExpense, {
      foreignKey: 'projectId',
      as: 'expenses'
    });

    Project.hasMany(models.ServiceRequest, {
      foreignKey: 'projectId',
      as: 'serviceRequests'
    });
  };

  return Project;
};