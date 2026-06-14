const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class GroupMembership extends Model {
  static async getActiveMembersAt(groupId, atDate) {
    const memberships = await this.findAll({
      where: {
        group_id: groupId,
        joined_at: {
          [require('sequelize').Op.lte]: atDate
        }
      }
    });

    return memberships.filter(m => {
      if (!m.left_at) return true;
      return m.left_at > atDate;
    });
  }

  isActiveAt(date) {
    if (this.joined_at > date) return false;
    if (!this.left_at) return true;
    return this.left_at > date;
  }
}

GroupMembership.init(
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'GroupMembership',
    tableName: 'group_memberships',
    indexes: [
      {
        unique: true,
        fields: ['group_id', 'user_id'],
        where: {
          left_at: null
        }
      },
      {
        fields: ['group_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['joined_at']
      },
      {
        fields: ['left_at']
      }
    ]
  }
);

module.exports = GroupMembership;
