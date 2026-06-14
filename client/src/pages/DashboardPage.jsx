import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Receipt,
  TrendingUp,
  Upload,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore, useGroupStore, useExpenseStore } from '../store';
import { formatPaise, classNames } from '../utils';
import { LoadingSpinner } from '../components';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { groups, fetchGroups, isLoading: groupsLoading } = useGroupStore();
  const {
    balances,
    settlementSuggestions,
    fetchBalances,
    fetchSettlementSuggestions,
  } = useExpenseStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (groups.length > 0) {
      fetchBalances(groups[0]?.id);
      fetchSettlementSuggestions(groups[0]?.id);
    }
  }, [groups, fetchBalances, fetchSettlementSuggestions]);

  const activeGroup = groups[0];
  const userBalance = balances.find((b) => b.userId === user?.id);
  const userOwes = (userBalance?.net || 0) < 0;
  const balanceAmount = Math.abs(userBalance?.net || 0);

  // Chart data
  const balanceChartData = balances.slice(0, 6).map((b) => ({
    name: b.userName?.split(' ')[0] || 'Unknown',
    balance: Math.abs(b.net || 0),
    type: (b.net || 0) >= 0 ? 'credit' : 'debt',
  }));

  const pieData = balances
    .filter((b) => b.net !== 0)
    .slice(0, 6)
    .map((b, i) => ({
      name: b.userName?.split(' ')[0] || 'Unknown',
      value: Math.abs(b.net || 0),
      color: COLORS[i % COLORS.length],
    }));

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your shared expenses
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Groups</p>
              <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-4">
            <div className={classNames(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              userOwes ? 'bg-red-100' : 'bg-green-100'
            )}>
              {userOwes ? (
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              ) : (
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {userOwes ? 'You Owe' : 'You Get Back'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPaise(balanceAmount)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Settlements Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {settlementSuggestions.length}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {balances.reduce((sum, b) => sum + (b.expenses_paid?.length || 0), 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <Link
          to="/groups/new"
          className="card-hover p-6 flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center group-hover:bg-accent-600 transition-colors">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Create Group</p>
            <p className="text-sm text-gray-500">Start a new expense group</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-accent-500 transition-colors" />
        </Link>

        <Link
          to="/import"
          className="card-hover p-6 flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Import CSV</p>
            <p className="text-sm text-gray-500">Bulk import expenses</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-green-500 transition-colors" />
        </Link>

        <Link
          to="/balances"
          className="card-hover p-6 flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center group-hover:bg-yellow-600 transition-colors">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">View Balances</p>
            <p className="text-sm text-gray-500">See who owes what</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-yellow-500 transition-colors" />
        </Link>
      </motion.div>

      {/* Charts */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Balance Overview
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₹${(value / 100).toFixed(0)}`} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatPaise(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar
                    dataKey="balance"
                    fill="#6366F1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Settlement Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatPaise(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* No Groups State */}
      {groups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-accent-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No groups yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first group to start tracking shared expenses with your flatmates.
          </p>
          <Link to="/groups/new" className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Group
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
