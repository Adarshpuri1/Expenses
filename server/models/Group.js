const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Group extends Model {}

Group.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    indexes: [
      {
        fields: ['created_by']
      }
    ]
  }
);

module.exports = Group;
