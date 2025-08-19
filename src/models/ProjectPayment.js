'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectPayment = sequelize.define('ProjectPayment', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Payment name is required'
        }
      }
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Payment amount must be positive'
        },
        notEmpty: {
          msg: 'Payment amount is required'
        }
      }
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Percentage must be non-negative'
        },
        max: {
          args: [100],
          msg: 'Percentage cannot exceed 100'
        }
      }
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'invoiced',
        'paid',
        'overdue'
      ),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'project_payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['due_date']
      },
      {
        fields: ['payment_date']
      }
    ]
  });

  // Associations
  ProjectPayment.associate = function(models) {
    ProjectPayment.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return ProjectPayment;
};