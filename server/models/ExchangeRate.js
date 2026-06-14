const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ExchangeRate extends Model {}

ExchangeRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    from_currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      validate: {
        isUppercase: true,
        len: [3, 3]
      }
    },
    to_currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      validate: {
        isUppercase: true,
        len: [3, 3]
      }
    },
    rate: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false,
      comment: 'Exchange rate: 1 from_currency = rate to_currency'
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'API source used to fetch rate'
    },
    fetched_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'ExchangeRate',
    tableName: 'exchange_rates',
    indexes: [
      {
        unique: true,
        fields: ['from_currency', 'to_currency']
      },
      {
        fields: ['expires_at']
      }
    ]
  }
);

module.exports = ExchangeRate;
