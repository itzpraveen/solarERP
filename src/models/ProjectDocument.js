'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectDocument = sequelize.define('ProjectDocument', {
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
    type: {
      type: DataTypes.ENUM(
        'permit',
        'contract',
        'design',
        'inspection',
        'utility',
        'warranty',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Document type is required'
        }
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Document name is required'
        }
      }
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'File URL is required'
        }
      }
    },
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'project_documents',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['project_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['uploaded_by_id']
      },
      {
        fields: ['uploaded_at']
      }
    ]
  });

  // Associations
  ProjectDocument.associate = function(models) {
    ProjectDocument.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
    
    ProjectDocument.belongsTo(models.User, {
      foreignKey: 'uploadedById',
      as: 'uploadedBy'
    });
  };

  return ProjectDocument;
};