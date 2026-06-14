export const formatPaise = (paise, showSign = false) => {
  const rupees = paise / 100;
  const absRupees = Math.abs(rupees);
  const prefix = paise >= 0 ? '₹' : '-₹';
  const sign = paise >= 0 ? '' : '-';

  if (showSign && paise > 0) {
    return `+₹${absRupees.toFixed(2)}`;
  }
  return `${prefix}${absRupees.toFixed(2)}`;
};

export const parseToPaise = (amount) => {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    return Math.round(parseFloat(cleaned) * 100);
  }
  return 0;
};

export const formatCurrencyDisplay = (amountInPaise, originalAmount, originalCurrency, rate) => {
  const formattedInr = formatPaise(amountInPaise);
  if (originalCurrency === 'INR') {
    return formattedInr;
  }

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };

  const symbol = currencySymbols[originalCurrency] || originalCurrency;
  const originalFormatted = `${symbol}${(originalAmount / 100).toFixed(2)}`;

  return `${formattedInr} (was ${originalFormatted} @ ${rate.toFixed(2)})`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const truncate = (str, length = 30) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
};

export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'error':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'info':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getAnomalyActionColor = (action) => {
  switch (action) {
    case 'approved':
      return 'text-green-600';
    case 'rejected':
      return 'text-red-600';
    case 'auto_resolved':
      return 'text-blue-600';
    case 'ignored':
      return 'text-gray-600';
    default:
      return 'text-yellow-600';
  }
};

export const generateRandomColor = () => {
  const colors = [
    'bg-accent-100 text-accent-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
    'bg-red-100 text-red-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
