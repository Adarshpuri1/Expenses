const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Expense extends Model {}

Expense.init(
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
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500]
      }
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Amount in paise (integer)'
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'INR',
      validate: {
        isUppercase: true,
        len: [3, 3]
      }
    },
    amount_inr: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Converted amount in INR paise'
    },
    exchange_rate: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: 'Exchange rate used for conversion'
    },
    split_type: {
      type: DataTypes.ENUM('equal', 'exact', 'percentage', 'shares'),
      allowNull: false,
      defaultValue: 'equal'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    is_settlement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_duplicate_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_refund: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    import_row_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Reference to original CSV row for imports'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses',
    indexes: [
      {
        fields: ['group_id']
      },
      {
        fields: ['paid_by']
      },
      {
        fields: ['date']
      },
      {
        fields: ['group_id', 'date']
      }
    ]
  }
);

module.exports = Expense;
