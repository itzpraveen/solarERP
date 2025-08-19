'use strict';

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'First name is required'
        },
        len: {
          args: [1, 100],
          msg: 'First name must be between 1 and 100 characters'
        }
      }
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Last name is required'
        },
        len: {
          args: [1, 100],
          msg: 'Last name must be between 1 and 100 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Please use a valid email address'
        },
        notEmpty: {
          msg: 'Email is required'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Phone number is required'
        }
      }
    },
    // Address fields
    street: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Street address is required'
        }
      }
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'City is required'
        }
      }
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'State is required'
        }
      }
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'ZIP code is required'
        }
      }
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'USA'
    },
    // Secondary contact information
    secondaryContact: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidSecondaryContact(value) {
          if (value && typeof value === 'object') {
            const validFields = ['firstName', 'lastName', 'email', 'phone', 'relationship'];
            const providedFields = Object.keys(value);
            const hasInvalidFields = providedFields.some(field => !validFields.includes(field));
            
            if (hasInvalidFields) {
              throw new Error('Invalid secondary contact fields');
            }
            
            if (value.email && !/^\S+@\S+\.\S+$/.test(value.email)) {
              throw new Error('Invalid secondary contact email format');
            }
          }
        }
      }
    },
    // Foreign key references
    originalLeadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    acceptedProposalId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'proposals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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
    customerSince: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    communicationPreference: {
      type: DataTypes.ENUM('email', 'phone', 'text', 'mail'),
      allowNull: false,
      defaultValue: 'email'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (customer) => {
        if (customer.email) {
          customer.email = customer.email.toLowerCase();
        }
      },
      beforeUpdate: (customer) => {
        if (customer.changed('email')) {
          customer.email = customer.email.toLowerCase();
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
        fields: ['last_name', 'first_name']
      },
      {
        fields: ['email'],
        unique: false
      },
      {
        fields: ['zip_code']
      },
      {
        fields: ['customer_since']
      },
      {
        fields: ['original_lead_id']
      },
      {
        fields: ['created_by_id']
      }
    ]
  });

  // Associations
  Customer.associate = function(models) {
    // Belongs to relationships
    Customer.belongsTo(models.Lead, {
      foreignKey: 'originalLeadId',
      as: 'originalLead'
    });
    
    Customer.belongsTo(models.Proposal, {
      foreignKey: 'acceptedProposalId',
      as: 'acceptedProposal'
    });
    
    Customer.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });

    // Has many relationships
    Customer.hasMany(models.Project, {
      foreignKey: 'customerId',
      as: 'projects'
    });

    Customer.hasMany(models.ServiceRequest, {
      foreignKey: 'customerId',
      as: 'serviceRequests'
    });

    Customer.hasMany(models.CustomerNote, {
      foreignKey: 'customerId',
      as: 'notes'
    });
  };

  return Customer;
};