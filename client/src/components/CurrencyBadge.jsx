import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw } from 'lucide-react';

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'Fr',
  CNY: '¥',
};

const currencyColors = {
  USD: 'bg-green-100 text-green-700 border-green-200',
  EUR: 'bg-blue-100 text-blue-700 border-blue-200',
  GBP: 'bg-purple-100 text-purple-700 border-purple-200',
  INR: 'bg-orange-100 text-orange-700 border-orange-200',
  JPY: 'bg-red-100 text-red-700 border-red-200',
  AUD: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CAD: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  CHF: 'bg-teal-100 text-teal-700 border-teal-200',
  CNY: 'bg-rose-100 text-rose-700 border-rose-200',
};

const CurrencyBadge = ({ currency, converted = false, rate = null, className = '' }) => {
  const symbol = currencySymbols[currency] || currency;
  const colorClass = currencyColors[currency] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium border ${colorClass} ${className}`}
    >
      <DollarSign className="w-3.5 h-3.5" />
      <span>{symbol}</span>
      <span className="text-xs opacity-75">{currency}</span>
      {converted && (
        <span className="ml-1 flex items-center text-xs">
          <RefreshCw className="w-3 h-3 mr-0.5" />
          {rate?.toFixed(2)}
        </span>
      )}
    </motion.div>
  );
};

export default CurrencyBadge;
