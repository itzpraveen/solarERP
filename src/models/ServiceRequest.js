'use strict';

module.exports = (sequelize, DataTypes) => {
  const ServiceRequest = sequelize.define('ServiceRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Title is required'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Description is required'
        }
      }
    },
    requestType: {
      type: DataTypes.ENUM('maintenance', 'repair', 'installation', 'inspection', 'other'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Request type is required'
        }
      }
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('new', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'new'
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
    projectId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    assignedToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completionDate: {
      type: DataTypes.DATE,
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
    updatedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    tableName: 'service_requests',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (serviceRequest) => {
        // Auto-set completion date when status changes to completed
        if (serviceRequest.changed('status') && serviceRequest.status === 'completed') {
          if (!serviceRequest.completionDate) {
            serviceRequest.completionDate = new Date();
          }
        }
      }
    },
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['project_id']
      },
      {
        fields: ['assigned_to_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['request_type']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['scheduled_date']
      },
      {
        fields: ['created_by_id']
      }
    ]
  });

  // Associations
  ServiceRequest.associate = function(models) {
    // Belongs to relationships
    ServiceRequest.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    
    ServiceRequest.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    ServiceRequest.belongsTo(models.User, {
      foreignKey: 'assignedToId',
      as: 'assignedTo'
    });
    
    ServiceRequest.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });
    
    ServiceRequest.belongsTo(models.User, {
      foreignKey: 'updatedById',
      as: 'updatedBy'
    });

    // Has many relationships
    ServiceRequest.hasMany(models.ServiceRequestNote, {
      foreignKey: 'serviceRequestId',
      as: 'notes'
    });
  };

  return ServiceRequest;
};