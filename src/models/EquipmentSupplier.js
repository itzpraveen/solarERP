'use strict';

module.exports = (sequelize, DataTypes) => {
  const EquipmentSupplier = sequelize.define('EquipmentSupplier', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    equipmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'equipment',
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
          msg: 'Supplier name is required'
        }
      }
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    preferredSupplier: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    leadTimeInDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Lead time must be non-negative'
        }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'equipment_suppliers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['equipment_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['preferred_supplier']
      }
    ]
  });

  // Associations
  EquipmentSupplier.associate = function(models) {
    EquipmentSupplier.belongsTo(models.Equipment, {
      foreignKey: 'equipmentId',
      as: 'equipment'
    });
  };

  return EquipmentSupplier;
};