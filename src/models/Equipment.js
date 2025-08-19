'use strict';

module.exports = (sequelize, DataTypes) => {
  const Equipment = sequelize.define('Equipment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'panel',
        'inverter',
        'battery',
        'optimizer',
        'racking',
        'monitoring',
        'disconnect',
        'breaker',
        'wiring',
        'conduit',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Equipment type is required'
        }
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Equipment name is required'
        }
      }
    },
    manufacturer: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Manufacturer is required'
        }
      }
    },
    model: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Model number is required'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Specifications stored as JSON
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    // Cost information
    purchaseCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Purchase cost must be non-negative'
        },
        notEmpty: {
          msg: 'Purchase cost is required'
        }
      }
    },
    installationCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Installation cost must be non-negative'
        }
      }
    },
    shippingCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Shipping cost must be non-negative'
        }
      }
    },
    // Pricing information
    msrp: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'MSRP must be non-negative'
        }
      }
    },
    dealerPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Dealer price must be non-negative'
        }
      }
    },
    preferredCustomerPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Preferred customer price must be non-negative'
        }
      }
    },
    // Inventory tracking
    inStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'In stock quantity must be non-negative'
        }
      }
    },
    allocated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'Allocated quantity must be non-negative'
        }
      }
    },
    onOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'On order quantity must be non-negative'
        }
      }
    },
    minimumStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: {
          args: [0],
          msg: 'Minimum stock must be non-negative'
        }
      }
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    discontinued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'equipment',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: { active: true }
    },
    scopes: {
      includeInactive: {
        where: {}
      },
      inStock: {
        where: sequelize.literal('in_stock > allocated')
      },
      needsReorder: {
        where: sequelize.literal('(in_stock - allocated) <= minimum_stock')
      }
    },
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['manufacturer', 'model']
      },
      {
        fields: ['in_stock']
      },
      {
        fields: ['discontinued']
      },
      {
        fields: ['created_by_id']
      }
    ]
  });

  // Virtual fields
  Equipment.addHook('afterFind', (equipmentInstance) => {
    if (Array.isArray(equipmentInstance)) {
      equipmentInstance.forEach(equipment => addVirtuals(equipment));
    } else if (equipmentInstance) {
      addVirtuals(equipmentInstance);
    }
  });

  function addVirtuals(equipment) {
    // Total cost virtual
    equipment.dataValues.totalCost = equipment.purchaseCost + 
      (equipment.installationCost || 0) + 
      (equipment.shippingCost || 0);
    
    // Available stock virtual
    equipment.dataValues.availableStock = (equipment.inStock - equipment.allocated) + equipment.onOrder;
    
    // Needs reorder virtual
    equipment.dataValues.needsReorder = (equipment.inStock - equipment.allocated) <= equipment.minimumStock;
  }

  // Associations
  Equipment.associate = function(models) {
    Equipment.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });

    Equipment.hasMany(models.EquipmentSupplier, {
      foreignKey: 'equipmentId',
      as: 'suppliers'
    });

    // Many-to-many for compatible products
    Equipment.belongsToMany(models.Equipment, {
      through: 'equipment_compatibility',
      foreignKey: 'equipmentId',
      otherKey: 'compatibleEquipmentId',
      as: 'compatibleProducts'
    });
  };

  return Equipment;
};