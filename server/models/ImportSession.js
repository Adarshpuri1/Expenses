const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class ImportSession extends Model {}

ImportSession.init(
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
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    imported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    imported_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    report_json: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Complete import report with anomalies and statistics'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'confirmed', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    total_rows: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    clean_rows: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    anomaly_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'ImportSession',
    tableName: 'import_sessions',
    indexes: [
      {
        fields: ['group_id']
      },
      {
        fields: ['imported_by']
      },
      {
        fields: ['status']
      }
    ]
  }
);

module.exports = ImportSession;
