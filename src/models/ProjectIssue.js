'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectIssue = sequelize.define('ProjectIssue', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Issue title is required'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Issue description is required'
        }
      }
    },
    priority: {
      type: DataTypes.ENUM(
        'low',
        'medium',
        'high',
        'critical'
      ),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM(
        'open',
        'in_progress',
        'resolved',
        'closed'
      ),
      allowNull: false,
      defaultValue: 'open'
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
    reportedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    reportedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'project_issues',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeUpdate: (issue) => {
        // Auto-set resolved date when status changes to resolved or closed
        if (issue.changed('status') && (issue.status === 'resolved' || issue.status === 'closed')) {
          if (!issue.resolvedAt) {
            issue.resolvedAt = new Date();
          }
        }
      }
    },
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['assigned_to_id']
      },
      {
        fields: ['reported_by_id']
      },
      {
        fields: ['reported_at']
      }
    ]
  });

  // Associations
  ProjectIssue.associate = function(models) {
    ProjectIssue.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    ProjectIssue.belongsTo(models.User, {
      foreignKey: 'assignedToId',
      as: 'assignedTo'
    });
    
    ProjectIssue.belongsTo(models.User, {
      foreignKey: 'reportedById',
      as: 'reportedBy'
    });
  };

  return ProjectIssue;
};