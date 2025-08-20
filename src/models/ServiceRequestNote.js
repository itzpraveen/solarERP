'use strict';

module.exports = (sequelize, DataTypes) => {
  const ServiceRequestNote = sequelize.define('ServiceRequestNote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    serviceRequestId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'service_requests',
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
    tableName: 'service_request_notes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['service_request_id']
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
  ServiceRequestNote.associate = function(models) {
    ServiceRequestNote.belongsTo(models.ServiceRequest, {
      foreignKey: 'serviceRequestId',
      as: 'serviceRequest'
    });
    
    ServiceRequestNote.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });
  };

  return ServiceRequestNote;
};