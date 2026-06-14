import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Calendar, Users, Split, ArrowLeft } from 'lucide-react';
import { useGroupStore } from '../store';
import { expensesAPI } from '../api';
import { parseToPaise, formatPaise } from '../utils';
import toast from 'react-hot-toast';

const CreateExpensePage = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { currentGroup, members, fetchGroupById, fetchMembers } = useGroupStore();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'INR',
    paid_by: '',
    split_type: 'equal',
    date: new Date().toISOString().split('T')[0],
    splits: [],
  });
  const [customSplits, setCustomSplits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupById(groupId);
      fetchMembers(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (members.length > 0 && formData.paid_by === '') {
      // Set default payer to first member
      setFormData((prev) => ({
        ...prev,
        paid_by: members[0]?.user?.id || members[0]?.id || '',
      }));
      // Initialize custom splits for all members
      initializeCustomSplits(members);
    }
  }, [members]);

  const initializeCustomSplits = (membersList) => {
    const splits = membersList
      .filter((m) => !m.left_at)
      .map((m) => ({
        userId: m.user?.id || m.id,
        name: m.user?.name || m.name,
        amount: 0,
        percentage: 0,
        shares: 1,
      }));
    setCustomSplits(splits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const amountInPaise = parseToPaise(formData.amount);
    if (amountInPaise <= 0) {
      toast.error('Please enter a valid amount');
      setIsSubmitting(false);
      return;
    }

    const expenseData = {
      description: formData.description,
      amount: amountInPaise,
      currency: formData.currency,
      paid_by: parseInt(formData.paid_by),
      split_type: formData.split_type,
      date: formData.date,
    };

    if (formData.split_type !== 'equal') {
      expenseData.splits = customSplits.map((s) => ({
        userId: s.userId,
        ...(formData.split_type === 'exact' && { amount: s.amount }),
        ...(formData.split_type === 'percentage' && { percentage: s.percentage }),
        ...(formData.split_type === 'shares' && { shares: s.shares }),
      }));
    }

    try {
      const response = await expensesAPI.create(groupId, expenseData);
      toast.success('Expense created successfully');
      navigate(`/groups/${groupId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSplitChange = (userId, field, value) => {
    setCustomSplits((prev) =>
      prev.map((s) =>
        s.userId === userId ? { ...s, [field]: parseFloat(value) || 0 } : s
      )
    );
  };

  const totalSplitAmount = customSplits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPercentage = customSplits.reduce((sum, s) => sum + (s.percentage || 0), 0);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/groups/${groupId}`)}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Group
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
        <p className="text-gray-600 mt-1">
          {currentGroup?.name ? `For ${currentGroup.name}` : ''}
        </p>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Description */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field pl-10"
              placeholder="What was this expense for?"
              required
            />
          </div>
        </div>

        {/* Amount and Currency */}
        <div className="card p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="input-field pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="input-field"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date and Payer */}
        <div className="card p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paid By
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.paid_by}
                  onChange={(e) =>
                    setFormData({ ...formData, paid_by: e.target.value })
                  }
                  className="input-field pl-10"
                  required
                >
                  {members
                    .filter((m) => !m.left_at)
                    .map((m) => (
                      <option key={m.user?.id || m.id} value={m.user?.id || m.id}>
                        {m.user?.name || m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Split Type */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Split Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'equal', label: 'Equal' },
              { value: 'exact', label: 'Exact' },
              { value: 'percentage', label: 'Percentage' },
              { value: 'shares', label: 'Shares' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, split_type: option.value })
                }
                className={`py-2 px-4 rounded-lg border transition-colors ${
                  formData.split_type === option.value
                    ? 'bg-accent-500 text-white border-accent-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Split Inputs */}
          {formData.split_type !== 'equal' && (
            <div className="mt-4 space-y-3">
              {customSplits.map((split) => (
                <div key={split.userId} className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium">{split.name}</div>
                  {formData.split_type === 'exact' && (
                    <input
                      type="number"
                      step="0.01"
                      value={split.amount}
                      onChange={(e) =>
                        handleCustomSplitChange(split.userId, 'amount', e.target.value)
                      }
                      className="input-field w-24"
                      placeholder="0.00"
                    />
                  )}
                  {formData.split_type === 'percentage' && (
                    <input
                      type="number"
                      step="1"
                      value={split.percentage}
                      onChange={(e) =>
                        handleCustomSplitChange(split.userId, 'percentage', e.target.value)
                      }
                      className="input-field w-24"
                      placeholder="0"
                    />
                  )}
                  {formData.split_type === 'shares' && (
                    <input
                      type="number"
                      step="1"
                      value={split.shares}
                      onChange={(e) =>
                        handleCustomSplitChange(split.userId, 'shares', e.target.value)
                      }
                      className="input-field w-24"
                      placeholder="1"
                    />
                  )}
                </div>
              ))}

              {/* Split Validation */}
              {formData.split_type === 'percentage' && totalPercentage !== 100 && (
                <p className="text-sm text-yellow-600">
                  Percentages must sum to 100% (currently {totalPercentage}%)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'Creating...' : 'Create Expense'}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateExpensePage;
