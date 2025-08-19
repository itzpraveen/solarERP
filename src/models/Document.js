'use strict';

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(
        'permit',
        'contract',
        'design',
        'proposal',
        'inspection',
        'utility',
        'warranty',
        'invoice',
        'customer',
        'marketing',
        'legal',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Document type is required'
        }
      }
    },
    category: {
      type: DataTypes.ENUM(
        'project',
        'customer',
        'lead',
        'proposal',
        'equipment',
        'finance',
        'company',
        'employee',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other'
    },
    // Related entity information
    relatedEntityType: {
      type: DataTypes.ENUM(
        'project',
        'customer',
        'lead',
        'proposal',
        'equipment',
        'user',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Related entity type is required'
        }
      }
    },
    relatedEntityId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Related entity ID is required'
        }
      }
    },
    // File storage information
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Original file name is required'
        }
      }
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'File MIME type is required'
        }
      }
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'File size must be non-negative'
        },
        notEmpty: {
          msg: 'File size is required'
        }
      }
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'File path is required'
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
    fileExtension: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    storageProvider: {
      type: DataTypes.ENUM('local', 's3', 'gcs', 'azure', 'other'),
      allowNull: false,
      defaultValue: 'local'
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'active',
        'archived',
        'expired',
        'pending_approval',
        'approved',
        'rejected'
      ),
      allowNull: false,
      defaultValue: 'active'
    },
    // Versioning
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: 'Version must be at least 1'
        }
      }
    },
    // Expiration
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Sharing
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    publicAccessUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    shareExpiration: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Tags for searching (stored as JSON array)
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    // Metadata (stored as JSON)
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
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
    updatedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'documents',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (document) => {
        // Generate public access URL if document is public
        if (document.isPublic && !document.publicAccessUrl) {
          const token = crypto.randomBytes(20).toString('hex');
          document.publicAccessUrl = `/documents/public/${token}`;
        }
      },
      beforeUpdate: (document) => {
        // Generate public access URL if document becomes public
        if (document.changed('isPublic') && document.isPublic && !document.publicAccessUrl) {
          const token = crypto.randomBytes(20).toString('hex');
          document.publicAccessUrl = `/documents/public/${token}`;
        }
      }
    },
    defaultScope: {
      where: { active: true }
    },
    scopes: {
      includeInactive: {
        where: {}
      },
      public: {
        where: { isPublic: true }
      }
    },
    indexes: [
      {
        fields: ['name'],
        type: 'FULLTEXT'
      },
      {
        fields: ['description'],
        type: 'FULLTEXT'
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['related_entity_type', 'related_entity_id']
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
        fields: ['is_public']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  // Virtual field for checking if expired
  Document.addHook('afterFind', (documentInstance) => {
    if (Array.isArray(documentInstance)) {
      documentInstance.forEach(doc => addVirtuals(doc));
    } else if (documentInstance) {
      addVirtuals(documentInstance);
    }
  });

  function addVirtuals(document) {
    document.dataValues.isExpired = document.expiresAt ? Date.now() > document.expiresAt : false;
  }

  // Associations
  Document.associate = function(models) {
    Document.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });
    
    Document.belongsTo(models.User, {
      foreignKey: 'updatedById',
      as: 'updatedBy'
    });

    Document.hasMany(models.DocumentVersion, {
      foreignKey: 'documentId',
      as: 'previousVersions'
    });

    Document.hasMany(models.DocumentAccessControl, {
      foreignKey: 'documentId',
      as: 'accessControls'
    });

    Document.hasMany(models.DocumentSignature, {
      foreignKey: 'documentId',
      as: 'signatures'
    });
  };

  return Document;
};