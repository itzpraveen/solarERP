'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectExpense = sequelize.define('ProjectExpense', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    category: {
      type: DataTypes.ENUM(
        'equipment',
        'labor',
        'permits',
        'subcontractor',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Expense category is required'
        }
      }
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Expense description is required'
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Expense amount must be positive'
        },
        notEmpty: {
          msg: 'Expense amount is required'
        }
      }
    },
    vendor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recordedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    }
  }, {
    tableName: 'project_expenses',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['date']
      },
      {
        fields: ['recorded_by_id']
      }
    ]
  });

  // Associations
  ProjectExpense.associate = function(models) {
    ProjectExpense.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    ProjectExpense.belongsTo(models.User, {
      foreignKey: 'recordedById',
      as: 'recordedBy'
    });
  };

  return ProjectExpense;
};