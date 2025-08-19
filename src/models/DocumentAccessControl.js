'use strict';

module.exports = (sequelize, DataTypes) => {
  const DocumentAccessControl = sequelize.define('DocumentAccessControl', {
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    accessType: {
      type: DataTypes.ENUM('read', 'write'),
      allowNull: false,
      defaultValue: 'read'
    }
  }, {
    tableName: 'document_access_controls',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['document_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['access_type']
      },
      {
        unique: true,
        fields: ['document_id', 'user_id', 'access_type']
      }
    ]
  });

  // Associations
  DocumentAccessControl.associate = function(models) {
    DocumentAccessControl.belongsTo(models.Document, {
      foreignKey: 'documentId',
      as: 'document'
    });
    
    DocumentAccessControl.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return DocumentAccessControl;
};