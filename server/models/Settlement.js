const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Settlement extends Model {}

Settlement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      }
    },
    paid_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    paid_to: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      },
      comment: 'Amount in paise (integer)'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expense_refs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of expense IDs this settlement covers'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Settlement',
    tableName: 'settlements',
    indexes: [
      {
        fields: ['group_id']
      },
      {
        fields: ['paid_by']
      },
      {
        fields: ['paid_to']
      },
      {
        fields: ['date']
      }
    ]
  }
);

module.exports = Settlement;
