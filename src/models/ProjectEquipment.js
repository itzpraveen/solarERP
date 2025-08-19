'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProjectEquipment = sequelize.define('ProjectEquipment', {
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
        'panel',
        'inverter',
        'battery',
        'optimizers',
        'racking',
        'monitoring',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Equipment type is required'
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
          msg: 'Model is required'
        }
      }
    },
    serialNumber: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Quantity must be at least 1'
        },
        notEmpty: {
          msg: 'Quantity is required'
        }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'project_equipment',
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
        fields: ['manufacturer', 'model']
      }
    ]
  });

  // Associations
  ProjectEquipment.associate = function(models) {
    ProjectEquipment.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return ProjectEquipment;
};