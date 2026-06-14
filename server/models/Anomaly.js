const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Anomaly extends Model {}

Anomaly.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    import_session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'import_sessions',
        key: 'id'
      }
    },
    row_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    anomaly_type: {
      type: DataTypes.ENUM(
        'DUPLICATE_EXACT',
        'DUPLICATE_SIMILAR',
        'CURRENCY_MISMATCH',
        'SETTLEMENT_AS_EXPENSE',
        'NEGATIVE_AMOUNT',
        'FUTURE_DATE',
        'INACTIVE_MEMBER',
        'MISSING_PAYER',
        'INVALID_SPLIT',
        'MISSING_CURRENCY',
        'FORMAT_INCONSISTENCY',
        'SPLIT_MEMBER_MISMATCH'
      ),
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
      allowNull: false,
      defaultValue: 'warning'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Original row data from CSV'
    },
    suggested_action: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    action_taken: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'auto_resolved', 'ignored'),
      allowNull: false,
      defaultValue: 'pending'
    },
    requires_approval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Anomaly',
    tableName: 'anomalies',
    indexes: [
      {
        fields: ['import_session_id']
      },
      {
        fields: ['anomaly_type']
      },
      {
        fields: ['action_taken']
      },
      {
        fields: ['severity']
      }
    ]
  }
);

module.exports = Anomaly;
