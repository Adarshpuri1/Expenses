import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Calendar, DollarSign, Users, Trash2, Edit } from 'lucide-react';
import { formatPaise, formatDate, getInitials, classNames } from '../utils';

const ExpenseCard = ({ expense, onDelete, onEdit, isDeletable = false }) => {
  const [expanded, setExpanded] = useState(false);

  const payer = expense.payer;
  const splits = expense.splits || [];
  const totalOwed = splits.reduce((sum, s) => sum + s.owed_amount, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="card-hover"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center font-medium">
              {getInitials(payer?.name || 'Unknown')}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{expense.description}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {payer?.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(expense.date)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              {formatPaise(expense.amount_inr || expense.amount)}
            </p>
            {expense.currency !== 'INR' && (
              <p className="text-xs text-gray-500">
                {expense.currency} {(expense.amount / 100).toFixed(2)}
              </p>
            )}
            {expense.is_refund && (
              <span className="badge badge-warning mt-1">Refund</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Split {expense.split_type} among {splits.length} people
          </span>
          <ChevronDown
            className={classNames(
              'w-5 h-5 text-gray-400 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Split Breakdown
              </h4>
              <div className="space-y-2">
                {splits.map((split, index) => {
                  const splitUser = split.user;
                  const isPayer = splitUser?.id === payer?.id;
                  return (
                    <div
                      key={split.id || index}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={classNames(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                            isPayer
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {getInitials(splitUser?.name || '?')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {splitUser?.name || 'Unknown'}
                            {isPayer && (
                              <span className="text-xs text-green-600 ml-1">
                                (payer)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            owes {formatPaise(split.owed_amount)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPaise(split.owed_amount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {(onDelete || onEdit) && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(expense);
                      }}
                      className="btn-secondary text-sm py-2 flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  )}
                  {onDelete && isDeletable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(expense);
                      }}
                      className="btn-danger text-sm py-2 flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExpenseCard;
