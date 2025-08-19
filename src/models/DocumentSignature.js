'use strict';

module.exports = (sequelize, DataTypes) => {
  const DocumentSignature = sequelize.define('DocumentSignature', {
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
    signedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    signatureData: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'document_signatures',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['document_id']
      },
      {
        fields: ['signed_by_id']
      },
      {
        fields: ['signed_at']
      },
      {
        fields: ['verified']
      }
    ]
  });

  // Associations
  DocumentSignature.associate = function(models) {
    DocumentSignature.belongsTo(models.Document, {
      foreignKey: 'documentId',
      as: 'document'
    });
    
    DocumentSignature.belongsTo(models.User, {
      foreignKey: 'signedById',
      as: 'signedBy'
    });
  };

  return DocumentSignature;
};