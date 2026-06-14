const User = require('./User');
const Group = require('./Group');
const GroupMembership = require('./GroupMembership');
const Expense = require('./Expense');
const ExpenseSplit = require('./ExpenseSplit');
const Settlement = require('./Settlement');
const ImportSession = require('./ImportSession');
const Anomaly = require('./Anomaly');
const ExchangeRate = require('./ExchangeRate');
const RefreshToken = require('./RefreshToken');

// Associations

// User - Group (creator)
User.hasMany(Group, { foreignKey: 'created_by', as: 'created_groups' });
Group.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// User - GroupMembership
User.hasMany(GroupMembership, { foreignKey: 'user_id', as: 'memberships' });
GroupMembership.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Group - GroupMembership
Group.hasMany(GroupMembership, { foreignKey: 'group_id', as: 'memberships' });
GroupMembership.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// User - Expense (payer)
User.hasMany(Expense, { foreignKey: 'paid_by', as: 'paid_expenses' });
Expense.belongsTo(User, { foreignKey: 'paid_by', as: 'payer' });

// Group - Expense
Group.hasMany(Expense, { foreignKey: 'group_id', as: 'expenses' });
Expense.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// Expense - ExpenseSplit
Expense.hasMany(ExpenseSplit, { foreignKey: 'expense_id', as: 'splits' });
ExpenseSplit.belongsTo(Expense, { foreignKey: 'expense_id', as: 'expense' });

// User - ExpenseSplit
User.hasMany(ExpenseSplit, { foreignKey: 'user_id', as: 'expense_splits' });
ExpenseSplit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Group - Settlement
Group.hasMany(Settlement, { foreignKey: 'group_id', as: 'settlements' });
Settlement.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// User - Settlement (payer)
User.hasMany(Settlement, { foreignKey: 'paid_by', as: 'settlements_paid' });
Settlement.belongsTo(User, { foreignKey: 'paid_by', as: 'payer' });

// User - Settlement (payee)
User.hasMany(Settlement, { foreignKey: 'paid_to', as: 'settlements_received' });
Settlement.belongsTo(User, { foreignKey: 'paid_to', as: 'payee' });

// Group - ImportSession
Group.hasMany(ImportSession, { foreignKey: 'group_id', as: 'import_sessions' });
ImportSession.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

// User - ImportSession
User.hasMany(ImportSession, { foreignKey: 'imported_by', as: 'imports' });
ImportSession.belongsTo(User, { foreignKey: 'imported_by', as: 'importer' });

// ImportSession - Anomaly
ImportSession.hasMany(Anomaly, { foreignKey: 'import_session_id', as: 'anomalies' });
Anomaly.belongsTo(ImportSession, { foreignKey: 'import_session_id', as: 'import_session' });

// User - Anomaly (approver)
User.hasMany(Anomaly, { foreignKey: 'approved_by', as: 'approved_anomalies' });
Anomaly.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// User - RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Group,
  GroupMembership,
  Expense,
  ExpenseSplit,
  Settlement,
  ImportSession,
  Anomaly,
  ExchangeRate,
  RefreshToken,
  sequelize
};
