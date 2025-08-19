'use strict';

module.exports = (sequelize, DataTypes) => {
  const CustomerNote = sequelize.define('CustomerNote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
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
    tableName: 'customer_notes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['customer_id']
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
  CustomerNote.associate = function(models) {
    CustomerNote.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    
    CustomerNote.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });
  };

  return CustomerNote;
};