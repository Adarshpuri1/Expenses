import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, TrendingDown, Minus, Receipt } from 'lucide-react';
import { formatPaise, classNames } from '../utils';

const BalanceCard = ({ balance, onClick }) => {
  const [expanded, setExpanded] = useState(false);

  const isPositive = balance.net > 0;
  const isNegative = balance.net < 0;
  const isNeutral = balance.net === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={classNames(
        'rounded-xl shadow-sm border overflow-hidden cursor-pointer transition-all',
        isPositive
          ? 'bg-green-50 border-green-200 hover:shadow-md'
          : isNegative
          ? 'bg-red-50 border-red-200 hover:shadow-md'
          : 'bg-gray-50 border-gray-200 hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={classNames(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isPositive
                  ? 'bg-green-200 text-green-700'
                  : isNegative
                  ? 'bg-red-200 text-red-700'
                  : 'bg-gray-200 text-gray-700'
              )}
            >
              {isPositive && <TrendingUp className="w-6 h-6" />}
              {isNegative && <TrendingDown className="w-6 h-6" />}
              {isNeutral && <Minus className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{balance.userName}</h3>
              <p className="text-sm text-gray-600">
                {isPositive && 'Gets back'}
                {isNegative && 'Owes'}
                {isNeutral && 'Settled'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={classNames(
                'text-xl font-bold',
                isPositive
                  ? 'text-green-700'
                  : isNegative
                  ? 'text-red-700'
                  : 'text-gray-700'
              )}
            >
              {formatPaise(Math.abs(balance.net), true)}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex items-center justify-between w-full mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Receipt className="w-4 h-4" />
            View details
          </span>
          <ChevronDown
            className={classNames(
              'w-4 h-4 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/50"
          >
            <div className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Total Paid</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPaise(balance.paid)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Total Owed</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPaise(balance.owed)}
                  </p>
                </div>
              </div>

              {balance.expenses_paid?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Expenses Paid ({balance.expenses_paid.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {balance.expenses_paid.slice(0, 5).map((exp, i) => (
                      <div
                        key={exp.expenseId || i}
                        className="flex justify-between text-sm py-1 px-2 bg-white rounded"
                      >
                        <span className="text-gray-700 truncate">
                          {exp.description}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPaise(exp.amount)}
                        </span>
                      </div>
                    ))}
                    {balance.expenses_paid.length > 5 && (
                      <p className="text-xs text-gray-500 text-center py-1">
                        +{balance.expenses_paid.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {balance.expenses_owed?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    Expenses Owed ({balance.expenses_owed.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {balance.expenses_owed.slice(0, 5).map((exp, i) => (
                      <div
                        key={exp.expenseId || i}
                        className="flex justify-between text-sm py-1 px-2 bg-white rounded"
                      >
                        <span className="text-gray-700 truncate">
                          {exp.description}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatPaise(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BalanceCard;
