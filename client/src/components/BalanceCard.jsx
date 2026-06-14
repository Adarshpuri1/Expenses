
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  Copy,
  CheckCircle2,
  Wallet,
  Users,
} from "lucide-react";

import { formatPaise, classNames, getInitials } from "../utils";

const BalanceCard = ({
  balance,
  onClick,
  onSettle,
}) => {
  const [expanded, setExpanded] = useState(false);

  const isPositive = balance.net > 0;
  const isNegative = balance.net < 0;
  const isNeutral = balance.net === 0;

  const totalTransactions =
    (balance.expenses_paid?.length || 0) +
    (balance.expenses_owed?.length || 0);

  const progress = useMemo(() => {
    if (!balance.paid) return 0;
    return Math.min(
      (balance.owed / balance.paid) * 100,
      100
    );
  }, [balance]);

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(`
User: ${balance.userName}
Paid: ${formatPaise(balance.paid)}
Owed: ${formatPaise(balance.owed)}
Net: ${formatPaise(Math.abs(balance.net))}
      `);
    } catch (err) {
      console.error(err);
    }
  };

  const statusConfig = {
    positive: {
      label: "Gets Back",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      iconBg: "bg-green-200",
      iconColor: "text-green-700",
      icon: TrendingUp,
    },
    negative: {
      label: "Owes",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      iconBg: "bg-red-200",
      iconColor: "text-red-700",
      icon: TrendingDown,
    },
    neutral: {
      label: "Settled",
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-700",
      iconBg: "bg-gray-200",
      iconColor: "text-gray-700",
      icon: Minus,
    },
  };

  const config = isPositive
    ? statusConfig.positive
    : isNegative
    ? statusConfig.negative
    : statusConfig.neutral;

  const Icon = config.icon;

  return (
    <motion.div
      layout
      whileHover={{
        y: -4,
        scale: 1.01,
      }}
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className={classNames(
        "rounded-2xl border shadow-sm overflow-hidden transition-all",
        config.bg,
        config.border
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="relative">
              <div
                className={classNames(
                  "w-14 h-14 rounded-full flex items-center justify-center font-bold",
                  config.iconBg,
                  config.iconColor
                )}
              >
                {getInitials(balance.userName)}
              </div>

              <div
                className={classNames(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center",
                  config.iconBg
                )}
              >
                <Icon size={14} />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {balance.userName}
              </h3>

              <span
                className={classNames(
                  "inline-flex mt-1 px-2 py-1 rounded-full text-xs font-medium",
                  config.iconBg,
                  config.text
                )}
              >
                {config.label}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p
              className={classNames(
                "text-2xl font-bold",
                config.text
              )}
            >
              {formatPaise(
                Math.abs(balance.net),
                true
              )}
            </p>

            <p className="text-xs text-gray-500">
              Net Balance
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-xl p-3">
            <Wallet
              size={16}
              className="mb-2 text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Paid
            </p>
            <p className="font-semibold">
              {formatPaise(balance.paid)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3">
            <Receipt
              size={16}
              className="mb-2 text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Owed
            </p>
            <p className="font-semibold">
              {formatPaise(balance.owed)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-3">
            <Users
              size={16}
              className="mb-2 text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Entries
            </p>
            <p className="font-semibold">
              {totalTransactions}
            </p>
          </div>
        </div>

        {/* Progress */}
        {!isNeutral && (
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-500">
                Balance Analysis
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>

            <div className="h-2 rounded-full bg-white overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${progress}%`,
                }}
                transition={{
                  duration: 0.8,
                }}
                className={classNames(
                  "h-full",
                  isPositive
                    ? "bg-green-500"
                    : "bg-red-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Expand Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="flex items-center justify-between w-full mt-5 pt-4 border-t border-gray-200"
        >
          <span className="text-sm font-medium text-gray-600">
            Transaction Details
          </span>

          <motion.div
            animate={{
              rotate: expanded ? 180 : 0,
            }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>
      </div>

      {/* Expanded Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            className="overflow-hidden bg-white"
          >
            <div className="p-5 border-t">
              {/* Expenses Paid */}
              {balance.expenses_paid?.length > 0 && (
                <div className="mb-5">
                  <h4 className="font-medium mb-3">
                    Expenses Paid
                  </h4>

                  <div className="space-y-2">
                    {balance.expenses_paid
                      .slice(0, 5)
                      .map((expense, index) => (
                        <div
                          key={
                            expense.expenseId ||
                            index
                          }
                          className="flex justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <span className="truncate">
                            {expense.description}
                          </span>

                          <span className="font-semibold">
                            {formatPaise(
                              expense.amount
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Expenses Owed */}
              {balance.expenses_owed?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">
                    Expenses Owed
                  </h4>

                  <div className="space-y-2">
                    {balance.expenses_owed
                      .slice(0, 5)
                      .map((expense, index) => (
                        <div
                          key={
                            expense.expenseId ||
                            index
                          }
                          className="flex justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <span className="truncate">
                            {expense.description}
                          </span>

                          <span className="font-semibold">
                            {formatPaise(
                              expense.amount
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyDetails();
                  }}
                  className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copy
                </button>

                {!isNeutral && onSettle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSettle(balance);
                    }}
                    className="flex-1 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Settle Up
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BalanceCard;
