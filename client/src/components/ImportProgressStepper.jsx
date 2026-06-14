
import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Upload,
  FileSearch,
  CheckSquare,
} from "lucide-react";
import { classNames } from "../utils";

const steps = [
  {
    id: 1,
    name: "Upload",
    icon: Upload,
    description: "Upload CSV file",
  },
  {
    id: 2,
    name: "Review",
    icon: FileSearch,
    description: "Review anomalies",
  },
  {
    id: 3,
    name: "Confirm",
    icon: CheckSquare,
    description: "Confirm import",
  },
];

const ImportProgressStepper = ({
  currentStep = 1,
  onStepClick,
}) => {
  const progress =
    ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Import Progress
          </h2>
          <p className="text-sm text-gray-500">
            Complete all steps to finish importing
          </p>
        </div>

        <div className="text-right">
          <span className="text-sm font-medium text-accent-600">
            {Math.round(progress)}%
          </span>
          <p className="text-xs text-gray-500">
            Completed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <nav aria-label="Progress">
        <ol className="grid grid-cols-3 gap-4">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            const Icon = step.icon;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={!isCompleted}
                  onClick={() =>
                    onStepClick?.(step.id)
                  }
                  className="w-full"
                >
                  <motion.div
                    whileHover={
                      isCompleted
                        ? { scale: 1.05 }
                        : {}
                    }
                    className={classNames(
                      "relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300",
                      isCompleted
                        ? "bg-green-50 border-green-200 cursor-pointer"
                        : isCurrent
                        ? "bg-accent-50 border-accent-300 shadow-lg"
                        : "bg-white border-gray-200"
                    )}
                  >
                    {/* Pulse Animation */}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl border-2 border-accent-400"
                        animate={{
                          scale: [1, 1.05, 1],
                          opacity: [0.8, 0.3, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={classNames(
                        "relative z-10 flex items-center justify-center w-14 h-14 rounded-full mb-3",
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-accent-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Icon size={22} />
                      )}
                    </div>

                    {/* Step Number */}
                    <span className="text-xs font-semibold text-gray-400 mb-1">
                      STEP {step.id}
                    </span>

                    {/* Title */}
                    <h3
                      className={classNames(
                        "font-semibold",
                        isCompleted
                          ? "text-green-700"
                          : isCurrent
                          ? "text-accent-700"
                          : "text-gray-500"
                      )}
                    >
                      {step.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-center text-gray-500 mt-1">
                      {step.description}
                    </p>

                    {/* Status Badge */}
                    <span
                      className={classNames(
                        "mt-3 px-3 py-1 text-xs rounded-full",
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : isCurrent
                          ? "bg-accent-100 text-accent-700"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {isCompleted
                        ? "Completed"
                        : isCurrent
                        ? "In Progress"
                        : "Pending"}
                    </span>
                  </motion.div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Completion Message */}
      {currentStep > steps.length && (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
        >
          <CheckCircle2
            size={40}
            className="mx-auto text-green-600 mb-3"
          />

          <h3 className="text-lg font-semibold text-green-700">
            Import Completed Successfully 🎉
          </h3>

          <p className="text-green-600 mt-1">
            Your expenses have been imported and processed.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ImportProgressStepper;

