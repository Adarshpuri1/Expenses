const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['revoked']
      }
    ]
  }
);

module.exports = RefreshToken;
