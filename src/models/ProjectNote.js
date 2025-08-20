'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectNote = sequelize.define('ProjectNote', {
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
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Note text is required'
        }
      }
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
    }
  }, {
    tableName: 'project_notes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['created_by_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Associations
  ProjectNote.associate = function(models) {
    ProjectNote.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    ProjectNote.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });
  };

  return ProjectNote;
};