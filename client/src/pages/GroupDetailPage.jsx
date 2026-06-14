import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Receipt, TrendingUp, Upload, Settings, UserPlus, ArrowLeft } from 'lucide-react';
import { useGroupStore, useExpenseStore } from '../store';
import { ExpenseCard, MemberTimeline, LoadingSpinner, BalanceCard } from '../components';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';

const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentGroup,
    members,
    fetchGroupById,
    fetchMembers,
    addMember,
    removeMember,
    clearCurrentGroup,
    isLoading
  } = useGroupStore();
  const {
    expenses,
    balances,
    fetchExpenses,
    fetchBalances,
    deleteExpense,
  } = useExpenseStore();
  const [activeTab, setActiveTab] = useState('expenses');

  useEffect(() => {
    if (id) {
      fetchGroupById(id);
      fetchMembers(id);
      fetchExpenses(id);
      fetchBalances(id);
    }
    return () => clearCurrentGroup();
  }, [id]);

  const handleDeleteExpense = async (expense) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    const result = await deleteExpense(id, expense.id);
    if (result.success) {
      toast.success('Expense deleted');
    } else {
      toast.error(result.error || 'Failed to delete expense');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Group not found</p>
        <Link to="/groups" className="text-accent-600 hover:underline">Back to groups</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentGroup.name}</h1>
            <p className="text-gray-600 mt-1">
              Created {formatDate(currentGroup.created_at)} • {members.length} members
            </p>
          </div>
          <div className="flex gap-3">
            <Link to={`/groups/${id}/import`} className="btn-secondary">
              <Upload className="w-5 h-5 mr-2" />
              Import
            </Link>
            <Link to={`/groups/${id}/expenses/new`} className="btn-primary">
              <Receipt className="w-5 h-5 mr-2" />
              Add Expense
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: 'expenses', label: 'Expenses', icon: Receipt },
            { id: 'balances', label: 'Balances', icon: TrendingUp },
            { id: 'members', label: 'Members', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-500 text-accent-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              {expenses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No expenses yet</p>
                  <Link to={`/groups/${id}/expenses/new`} className="text-accent-600 hover:underline">
                    Add your first expense
                  </Link>
                </div>
              ) : (
                expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDeleteExpense}
                    isDeletable={expense.paid_by === currentGroup.created_by}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'balances' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {balances.map((balance) => (
                <BalanceCard key={balance.userId} balance={balance} />
              ))}
            </div>
          )}

          {activeTab === 'members' && (
            <MemberTimeline memberships={members.map(m => ({ ...m, user: m.user || m }))} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-medium">{expenses.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">
                  ₹{(expenses.reduce((sum, e) => sum + (e.amount_inr || e.amount), 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Members</span>
                <span className="font-medium">{members.filter(m => !m.left_at).length}</span>
              </div>
            </div>
          </div>

          {/* Add Member */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Add Member</h3>
            <p className="text-sm text-gray-500 mb-4">
              Invite flatmates to join this group
            </p>
            <button className="btn-secondary w-full">
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
