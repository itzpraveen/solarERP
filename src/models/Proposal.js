'use strict';

module.exports = (sequelize, DataTypes) => {
  const Proposal = sequelize.define('Proposal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Proposal name is required'
        }
      }
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'sent',
        'viewed',
        'accepted',
        'rejected',
        'expired'
      ),
      allowNull: false,
      defaultValue: 'draft'
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
    yearlyProductionEstimate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Yearly production estimate must be positive'
        },
        notEmpty: {
          msg: 'Yearly production estimate in kWh is required'
        }
      }
    },
    // Savings estimates
    firstYearSavings: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'First year savings must be positive'
        },
        notEmpty: {
          msg: 'First year savings estimate is required'
        }
      }
    },
    twentyFiveYearSavings: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Twenty-five year savings must be positive'
        },
        notEmpty: {
          msg: 'Twenty-five year savings estimate is required'
        }
      }
    },
    // Pricing
    grossCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Gross cost must be positive'
        },
        notEmpty: {
          msg: 'Gross system cost is required'
        }
      }
    },
    federalTaxCredit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Federal tax credit must be non-negative'
        },
        notEmpty: {
          msg: 'Federal tax credit amount is required'
        }
      }
    },
    stateTaxCredit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'State tax credit must be non-negative'
        }
      }
    },
    utilityRebate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Utility rebate must be non-negative'
        }
      }
    },
    otherIncentives: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Other incentives must be non-negative'
        }
      }
    },
    netCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Net cost must be positive'
        },
        notEmpty: {
          msg: 'Net system cost after incentives is required'
        }
      }
    },
    // Design images stored as JSON array
    designImages: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
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
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    viewedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'proposals',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (proposal) => {
        // Auto-calculate net cost if not provided
        if (!proposal.netCost) {
          proposal.netCost = proposal.grossCost - 
            proposal.federalTaxCredit - 
            proposal.stateTaxCredit - 
            proposal.utilityRebate - 
            proposal.otherIncentives;
        }
      },
      beforeUpdate: (proposal) => {
        // Auto-update status dates
        if (proposal.changed('status')) {
          const now = new Date();
          
          switch (proposal.status) {
            case 'sent':
              if (!proposal.sentDate) proposal.sentDate = now;
              break;
            case 'viewed':
              if (!proposal.viewedDate) proposal.viewedDate = now;
              break;
            case 'accepted':
              if (!proposal.acceptedDate) proposal.acceptedDate = now;
              break;
            case 'rejected':
              if (!proposal.rejectedDate) proposal.rejectedDate = now;
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
        fields: ['lead_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_by_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['valid_until']
      }
    ]
  });

  // Associations
  Proposal.associate = function(models) {
    // Belongs to relationships
    Proposal.belongsTo(models.Lead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    
    Proposal.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });

    // Has many relationships
    Proposal.hasMany(models.ProposalFinancingOption, {
      foreignKey: 'proposalId',
      as: 'financingOptions'
    });

    // Has one relationships (when accepted and converted to customer/project)
    Proposal.hasOne(models.Customer, {
      foreignKey: 'acceptedProposalId',
      as: 'customer'
    });

    Proposal.hasOne(models.Project, {
      foreignKey: 'proposalId',
      as: 'project'
    });
  };

  return Proposal;
};