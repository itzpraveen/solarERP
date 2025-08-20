'use strict';

module.exports = (sequelize, DataTypes) => {
  const LeadNote = sequelize.define('LeadNote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'leads',
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
    tableName: 'lead_notes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['lead_id']
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
  LeadNote.associate = function(models) {
    LeadNote.belongsTo(models.Lead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    
    LeadNote.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy'
    });
  };

  return LeadNote;
};