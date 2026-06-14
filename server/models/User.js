const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

class User extends Model {
  async setPassword(password) {
    const saltRounds = 12;
    this.password_hash = await bcrypt.hash(password, saltRounds);
  }

  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }
}

User.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  }
);

module.exports = User;
