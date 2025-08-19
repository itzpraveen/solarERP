'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProposalFinancingOption = sequelize.define('ProposalFinancingOption', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    proposalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'proposals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    type: {
      type: DataTypes.ENUM(
        'cash',
        'loan',
        'lease',
        'ppa'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Financing type is required'
        }
      }
    },
    termYears: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Term years must be non-negative'
        }
      }
    },
    downPayment: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Down payment must be non-negative'
        }
      }
    },
    apr: {
      type: DataTypes.DECIMAL(5, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'APR must be non-negative'
        }
      }
    },
    monthlyPayment: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Monthly payment must be non-negative'
        }
      }
    },
    totalCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Total cost must be non-negative'
        }
      }
    },
    selected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'proposal_financing_options',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['proposal_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['selected']
      }
    ]
  });

  // Associations
  ProposalFinancingOption.associate = function(models) {
    ProposalFinancingOption.belongsTo(models.Proposal, {
      foreignKey: 'proposalId',
      as: 'proposal'
    });
  };

  return ProposalFinancingOption;
};