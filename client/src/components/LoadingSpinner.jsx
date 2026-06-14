import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-8',
  };

  return (
    <motion.div
      className={`${sizes[size]} ${className} animate-spin rounded-full border-accent-500 border-t-transparent`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

export default LoadingSpinner;
