import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Upload, FileSearch, CheckSquare } from 'lucide-react';
import { classNames } from '../utils';

const steps = [
  { id: 1, name: 'Upload', icon: Upload, description: 'Upload CSV file' },
  { id: 2, name: 'Review', icon: FileSearch, description: 'Review anomalies' },
  { id: 3, name: 'Confirm', icon: CheckSquare, description: 'Confirm import' },
];

const ImportProgressStepper = ({ currentStep }) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <li
              key={step.name}
              className={classNames(
                stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : '',
                'relative'
              )}
            >
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={classNames(
                    'relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-accent-500 border-accent-500'
                      : isCurrent
                      ? 'bg-white border-accent-500'
                      : 'bg-white border-gray-300'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : isCurrent ? (
                    <step.icon className="w-5 h-5 text-accent-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </motion.div>

                <div className="hidden sm:block ml-4">
                  <p
                    className={classNames(
                      'text-sm font-medium',
                      isCompleted
                        ? 'text-accent-600'
                        : isCurrent
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    )}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>

                {stepIdx !== steps.length - 1 && (
                  <div
                    className="hidden sm:block absolute top-6 left-16 w-12 sm:w-16 h-0.5"
                    aria-hidden="true"
                  >
                    <motion.div
                      className="h-full bg-gray-300"
                      initial={{ width: 0 }}
                    >
                      <motion.div
                        className={classNames(
                          'h-full',
                          isCompleted ? 'bg-accent-500' : 'bg-gray-300'
                        )}
                        initial={{ width: '0%' }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Mobile label */}
              <div className="sm:hidden mt-2 text-center">
                <p
                  className={classNames(
                    'text-xs font-medium',
                    isCompleted || isCurrent ? 'text-accent-600' : 'text-gray-400'
                  )}
                >
                  {step.name}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ImportProgressStepper;
