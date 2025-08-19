'use strict';

module.exports = (sequelize, DataTypes) => {
  const LeadInteraction = sequelize.define('LeadInteraction', {
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
    type: {
      type: DataTypes.ENUM(
        'email',
        'phone',
        'meeting',
        'site_visit',
        'proposal',
        'follow_up',
        'other'
      ),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Interaction type is required'
        }
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        notEmpty: {
          msg: 'Interaction date is required'
        }
      }
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Interaction summary is required'
        }
      }
    },
    conductedById: {
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
    tableName: 'lead_interactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['lead_id']
      },
      {
        fields: ['conducted_by_id']
      },
      {
        fields: ['date']
      },
      {
        fields: ['type']
      }
    ]
  });

  // Associations
  LeadInteraction.associate = function(models) {
    LeadInteraction.belongsTo(models.Lead, {
      foreignKey: 'leadId',
      as: 'lead'
    });
    
    LeadInteraction.belongsTo(models.User, {
      foreignKey: 'conductedById',
      as: 'conductedBy'
    });
  };

  return LeadInteraction;
};