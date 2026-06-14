
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  User,
  Calendar,
  Edit,
  Trash2,
  Users,
  Copy,
  Share2,
  CheckCircle2,
} from "lucide-react";

import {
  formatPaise,
  formatDate,
  getInitials,
  classNames,
} from "../utils";

const ExpenseCard = ({
  expense,
  onDelete,
  onEdit,
  isDeletable = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const payer = expense?.payer;
  const splits = expense?.splits || [];

  const participantCount = splits.length;

  const copyExpense = async () => {
    try {
      const text = `
Expense: ${expense.description}
Amount: ${formatPaise(
        expense.amount_inr || expense.amount
      )}
Paid By: ${payer?.name || "Unknown"}
Date: ${formatDate(expense.date)}
      `;

      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <motion.div
      layout
      whileHover={{
        y: -4,
      }}
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -15,
      }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between gap-4">
          {/* Left Side */}
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-semibold">
              {getInitials(payer?.name || "U")}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {expense.description}
              </h3>

              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {payer?.name || "Unknown"}
                </span>

                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(expense.date)}
                </span>

                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {participantCount} Members
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">
              {formatPaise(
                expense.amount_inr || expense.amount
              )}
            </p>

            {expense.currency &&
              expense.currency !== "INR" && (
                <p className="text-xs text-gray-500">
                  {expense.currency}{" "}
                  {(expense.amount / 100).toFixed(2)}
                </p>
              )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
            {expense.split_type}
          </span>

          {expense.category && (
            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
              {expense.category}
            </span>
          )}

          {expense.is_refund && (
            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
              Refund
            </span>
          )}

          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle2 size={12} />
            Active
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Split among {participantCount} people
          </p>

          <motion.div
            animate={{
              rotate: expanded ? 180 : 0,
            }}
            transition={{
              duration: 0.25,
            }}
          >
            <ChevronDown
              className="text-gray-400"
              size={20}
            />
          </motion.div>
        </div>
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
            transition={{
              duration: 0.3,
            }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 border-t border-gray-100 p-5">
              <h4 className="font-medium text-gray-700 mb-3">
                Split Breakdown
              </h4>

              <div className="space-y-3">
                {splits.map((split, index) => {
                  const splitUser = split.user;
                  const percentage =
                    expense.amount > 0
                      ? (
                          (split.owed_amount /
                            expense.amount) *
                          100
                        ).toFixed(1)
                      : 0;

                  const isPayer =
                    splitUser?.id === payer?.id;

                  return (
                    <div
                      key={split.id || index}
                      className="bg-white rounded-xl p-3 flex justify-between items-center"
                    >
                      <div className="flex gap-3 items-center">
                        <div
                          className={classNames(
                            "w-10 h-10 rounded-full flex items-center justify-center font-medium",
                            isPayer
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {getInitials(
                            splitUser?.name || "?"
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-sm">
                            {splitUser?.name}
                            {isPayer && (
                              <span className="ml-1 text-xs text-green-600">
                                (payer)
                              </span>
                            )}
                          </p>

                          <p className="text-xs text-gray-500">
                            {percentage}% share
                          </p>
                        </div>
                      </div>

                      <span className="font-semibold">
                        {formatPaise(
                          split.owed_amount
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyExpense();
                  }}
                  className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copy
                </button>

                <button
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  Share
                </button>

                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(expense);
                    }}
                    className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                )}

                {onDelete && isDeletable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(expense);
                    }}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
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

export default ExpenseCard;

