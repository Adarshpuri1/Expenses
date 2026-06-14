import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X, Check, HelpCircle } from 'lucide-react';
import { classNames, getSeverityColor } from '../utils';

const severityIcons = {
  critical: AlertCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityBorderColors = {
  critical: 'border-l-red-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

const AnomalyReviewTable = ({ anomalies, onResolve, resolved = {} }) => {
  const groupedAnomalies = {
    critical: anomalies.filter((a) => a.severity === 'critical' || a.severity === 'error'),
    warning: anomalies.filter((a) => a.severity === 'warning'),
    info: anomalies.filter((a) => a.severity === 'info'),
  };

  return (
    <div className="space-y-6">
      {groupedAnomalies.critical.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Critical Issues ({groupedAnomalies.critical.length})
          </h4>
          <div className="space-y-2">
            {groupedAnomalies.critical.map((anomaly, index) => (
              <AnomalyRow
                key={anomaly.id || index}
                anomaly={anomaly}
                onResolve={onResolve}
                resolved={resolved[anomaly.id]}
              />
            ))}
          </div>
        </div>
      )}

      {groupedAnomalies.warning.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnings ({groupedAnomalies.warning.length})
          </h4>
          <div className="space-y-2">
            {groupedAnomalies.warning.map((anomaly, index) => (
              <AnomalyRow
                key={anomaly.id || index}
                anomaly={anomaly}
                onResolve={onResolve}
                resolved={resolved[anomaly.id]}
              />
            ))}
          </div>
        </div>
      )}

      {groupedAnomalies.info.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Information ({groupedAnomalies.info.length})
          </h4>
          <div className="space-y-2">
            {groupedAnomalies.info.map((anomaly, index) => (
              <AnomalyRow
                key={anomaly.id || index}
                anomaly={anomaly}
                onResolve={onResolve}
                resolved={resolved[anomaly.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnomalyRow = ({ anomaly, onResolve, resolved }) => {
  const SeverityIcon = severityIcons[anomaly.severity] || Info;
  const borderColor = severityBorderColors[anomaly.severity] || 'border-l-gray-500';
  const isResolved = resolved !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={classNames(
        'border-l-4 bg-white rounded-lg shadow-sm p-4',
        borderColor,
        isResolved && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={classNames(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            anomaly.severity === 'critical' || anomaly.severity === 'error'
              ? 'bg-red-100'
              : anomaly.severity === 'warning'
              ? 'bg-yellow-100'
              : 'bg-blue-100'
          )}
        >
          <SeverityIcon
            className={classNames(
              'w-4 h-4',
              anomaly.severity === 'critical' || anomaly.severity === 'error'
                ? 'text-red-600'
                : anomaly.severity === 'warning'
                ? 'text-yellow-600'
                : 'text-blue-600'
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">
              Row {anomaly.rowNumber}
            </span>
            <span
              className={classNames(
                'badge',
                anomaly.severity === 'critical' || anomaly.severity === 'error'
                  ? 'badge-error'
                  : anomaly.severity === 'warning'
                  ? 'badge-warning'
                  : 'badge-info'
              )}
            >
              {anomaly.type}
            </span>
          </div>
          <p className="text-sm text-gray-900">{anomaly.description}</p>
          {anomaly.suggestedAction && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              Suggested: {anomaly.suggestedAction}
            </p>
          )}
        </div>

        {anomaly.requiresApproval && !isResolved && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onResolve(anomaly.id, 'approve')}
              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onResolve(anomaly.id, 'reject')}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isResolved && (
          <span
            className={classNames(
              'badge',
              resolved === 'approve' ? 'badge-success' : 'bg-gray-100 text-gray-600'
            )}
          >
            {resolved === 'approve' ? 'Approved' : 'Rejected'}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default AnomalyReviewTable;
