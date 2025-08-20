'use strict';

module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define('Lead', {
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
    source: {
      type: DataTypes.ENUM(
        'website',
        'referral',
        'partner',
        'cold_call',
        'event',
        'social_media',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Lead source is required'
        }
      }
    },
    status: {
      type: DataTypes.ENUM(
        'new',
        'contacted',
        'qualified',
        'proposal',
        'won',
        'lost',
        'inactive'
      ),
      allowNull: false,
      defaultValue: 'new',
      validate: {
        notEmpty: {
          msg: 'Lead status is required'
        }
      }
    },
    category: {
      type: DataTypes.ENUM('hot', 'warm', 'cold'),
      allowNull: false,
      defaultValue: 'warm'
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
    estimatedSystemSize: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Estimated system size must be positive'
        }
      }
    },
    monthlyElectricBill: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Monthly electric bill must be positive'
        }
      }
    },
    propertyType: {
      type: DataTypes.ENUM(
        'residential_single',
        'residential_multi',
        'commercial',
        'industrial',
        'agricultural',
        'other'
      ),
      allowNull: true
    },
    roofType: {
      type: DataTypes.ENUM(
        'shingle',
        'metal',
        'tile',
        'flat',
        'other'
      ),
      allowNull: true
    },
    roofAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Roof age must be positive'
        }
      }
    },
    shading: {
      type: DataTypes.ENUM(
        'none',
        'light',
        'moderate',
        'heavy'
      ),
      allowNull: true
    },
    nextFollowUp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'leads',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (lead) => {
        if (lead.email) {
          lead.email = lead.email.toLowerCase();
        }
      },
      beforeUpdate: (lead) => {
        if (lead.changed('email')) {
          lead.email = lead.email.toLowerCase();
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
        fields: ['status']
      },
      {
        fields: ['assigned_to_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['zip_code']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['source']
      },
      {
        fields: ['created_by_id']
      }
    ]
  });

  // Associations
  Lead.associate = function(models) {
    // Belongs to relationships
    Lead.belongsTo(models.User, {
      foreignKey: 'assignedToId',
      as: 'assignedTo'
    });
    
    Lead.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });

    // Has many relationships
    Lead.hasMany(models.Proposal, {
      foreignKey: 'leadId',
      as: 'proposals'
    });

    Lead.hasMany(models.LeadNote, {
      foreignKey: 'leadId',
      as: 'notes'
    });

    Lead.hasMany(models.LeadInteraction, {
      foreignKey: 'leadId',
      as: 'interactions'
    });

    // Has one relationship (when converted to customer)
    Lead.hasOne(models.Customer, {
      foreignKey: 'originalLeadId',
      as: 'customer'
    });
  };

  return Lead;
};