const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ExpenseSplit extends Model {}

ExpenseSplit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    expense_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'expenses',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    owed_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Amount in paise (integer)'
    },
    is_settled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    settled_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ExpenseSplit',
    tableName: 'expense_splits',
    indexes: [
      {
        unique: true,
        fields: ['expense_id', 'user_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['is_settled']
      }
    ]
  }
);

module.exports = ExpenseSplit;
