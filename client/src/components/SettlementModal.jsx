import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, DollarSign, Calendar, FileText } from 'lucide-react';
import { formatPaise } from '../utils';

const SettlementModal = ({ isOpen, onClose, settlement, members, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!settlement || isSubmitting) return;

    const amountInPaise = Math.round(parseFloat(amount) * 100);
    if (amountInPaise <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        paid_to: settlement.to_user_id,
        amount: amountInPaise,
        date,
        notes,
        expense_refs: settlement.expense_refs,
      });
      onClose();
    } catch (error) {
      console.error('Settlement error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultAmount = settlement?.amount
    ? (settlement.amount / 100).toFixed(2)
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Record Settlement
                    </h2>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Settlement Info */}
                  {settlement && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center font-medium text-lg mx-auto mb-1">
                            {settlement.from_user_name?.[0] || '?'}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {settlement.from_user_name || 'You'}
                          </p>
                          <p className="text-xs text-gray-500">Pays</p>
                        </div>

                        <div className="flex flex-col items-center">
                          <ArrowRight className="w-6 h-6 text-gray-400" />
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {settlement.amount_formatted || formatPaise(settlement.amount)}
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-medium text-lg mx-auto mb-1">
                            {settlement.to_user_name?.[0] || '?'}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {settlement.to_user_name}
                          </p>
                          <p className="text-xs text-gray-500">Receives</p>
                        </div>
                      </div>

                      {settlement.explanation && (
                        <p className="text-xs text-gray-500 text-center">
                          {settlement.explanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={amount || defaultAmount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="input-field pl-10"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="input-field pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (optional)
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="input-field pl-10 min-h-[80px] resize-none"
                          placeholder="Add a note..."
                        />
                      </div>
                    </div>

                    {settlement?.expense_refs?.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium">
                          This settlement covers {settlement.expense_refs.length} expense(s)
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !amount}
                        className="btn-primary flex-1"
                      >
                        {isSubmitting ? 'Recording...' : 'Record Settlement'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettlementModal;
