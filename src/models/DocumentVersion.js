'use strict';

module.exports = (sequelize, DataTypes) => {
  const DocumentVersion = sequelize.define('DocumentVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'documents',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Version number must be at least 1'
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
    tableName: 'document_versions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['document_id']
      },
      {
        fields: ['version_number']
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
  DocumentVersion.associate = function(models) {
    DocumentVersion.belongsTo(models.Document, {
      foreignKey: 'documentId',
      as: 'document'
    });
    
    DocumentVersion.belongsTo(models.User, {
      foreignKey: 'uploadedById',
      as: 'uploadedBy'
    });
  };

  return DocumentVersion;
};