import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, FileCheck, AlertCircle, CheckCircle, X, Download, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';
import {
  ImportProgressStepper,
  AnomalyReviewTable,
  LoadingSpinner,
} from '../components';
import { useImportStore, useExpenseStore } from '../store';
import toast from 'react-hot-toast';

const ImportPage = () => {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [resolvedAnomalies, setResolvedAnomalies] = useState({});

  const {
    importSessionId,
    importData,
    anomalies,
    previewExpenses,
    summary,
    currentStep,
    isUploading,
    isLoading,
    uploadCsv,
    confirmImport,
    resolveAnomaly,
    reset,
  } = useImportStore();

  const { fetchExpenses, fetchBalances } = useExpenseStore();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadCsv(groupId, file);

    if (result.success) {
      toast.success('CSV analyzed successfully');
    } else {
      toast.error(result.error || 'Failed to upload CSV');
    }
  };

  const handleResolveAnomaly = async (anomalyId, action) => {
    const result = await resolveAnomaly(groupId, anomalyId, action);
    if (result.success) {
      setResolvedAnomalies((prev) => ({
        ...prev,
        [anomalyId]: action,
      }));
      toast.success(`Anomaly ${action}d`);
    } else {
      toast.error(result.error || 'Failed to resolve');
    }
  };

  const handleConfirmImport = async () => {
    const result = await confirmImport(groupId);

    if (result.success) {
      toast.success(`Successfully imported ${result.data.summary.importedCount} expenses`);
      // Refresh expense list
      fetchExpenses(groupId);
      fetchBalances(groupId);
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 2000);
    } else {
      toast.error(result.error || 'Import failed');
    }
  };

  const handleReset = () => {
    reset();
    setResolvedAnomalies({});
  };

  // Download sample CSV
  const downloadSample = () => {
    const sampleData = [
      {
        date: '2024-01-15',
        description: 'Groceries from Supermarket',
        amount: '1250.00',
        currency: 'INR',
        paid_by: 'john@example.com',
        split_type: 'equal',
      },
      {
        date: '2024-01-16',
        description: 'Electricity Bill',
        amount: '3400.00',
        currency: 'INR',
        paid_by: 'jane@example.com',
        split_type: 'equal',
      },
    ];
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_expenses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Expenses</h1>
        <p className="text-gray-600 mt-1">
          Upload a CSV file to bulk import expenses
        </p>
      </div>

      {/* Progress Stepper */}
      <ImportProgressStepper currentStep={currentStep} />

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? 'border-accent-500 bg-accent-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                <LoadingSpinner size="lg" />
              </div>
            )}

            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Drop your CSV here
            </h3>
            <p className="text-gray-500 mb-4">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn-primary"
            >
              Select CSV File
            </button>
          </div>

          {/* Download Sample */}
          <div className="text-center">
            <button
              onClick={downloadSample}
              className="text-accent-600 hover:text-accent-700 text-sm flex items-center gap-1 mx-auto"
            >
              <Download className="w-4 h-4" />
              Download sample CSV
            </button>
          </div>

          {/* Format Help */}
          <div className="card p-6">
            <h4 className="font-medium text-gray-900 mb-4">Required CSV Format</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">
                      Column
                    </th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">
                      Description
                    </th>
                    <th className="text-left py-2 px-3 text-gray-600 font-medium">
                      Example
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3 font-mono text-accent-600">date</td>
                    <td className="py-2 px-3">Transaction date</td>
                    <td className="py-2 px-3 text-gray-500">2024-01-15</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-accent-600">description</td>
                    <td className="py-2 px-3">Expense description</td>
                    <td className="py-2 px-3 text-gray-500">Groceries</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-accent-600">amount</td>
                    <td className="py-2 px-3">Transaction amount</td>
                    <td className="py-2 px-3 text-gray-500">1250.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-accent-600">currency</td>
                    <td className="py-2 px-3">Currency code</td>
                    <td className="py-2 px-3 text-gray-500">INR, USD</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-accent-600">paid_by</td>
                    <td className="py-2 px-3">Payer email or ID</td>
                    <td className="py-2 px-3 text-gray-500">john@email.com</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-accent-600">split_type</td>
                    <td className="py-2 px-3">How to split</td>
                    <td className="py-2 px-3 text-gray-500">equal, exact</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review */}
      {currentStep === 2 && importData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{summary?.totalRows || 0}</p>
              <p className="text-sm text-gray-600">Total Rows</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary?.cleanRows || 0}</p>
              <p className="text-sm text-gray-600">Clean Rows</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary?.warningCount || 0}</p>
              <p className="text-sm text-gray-600">Warnings</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary?.criticalCount || 0}</p>
              <p className="text-sm text-gray-600">Errors</p>
            </div>
          </div>

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Review Anomalies ({anomalies.length})
              </h3>
              <AnomalyReviewTable
                anomalies={anomalies}
                onResolve={handleResolveAnomaly}
                resolved={resolvedAnomalies}
              />
            </div>
          )}

          {/* Preview Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preview ({previewExpenses.length} expenses)
            </h3>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Row
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewExpenses.slice(0, 20).map((expense, index) => (
                      <tr
                        key={index}
                        className={!expense.can_import ? 'bg-red-50' : ''}
                      >
                        <td className="py-2 px-4 text-gray-500">
                          {expense.rowNumber}
                        </td>
                        <td className="py-2 px-4 text-gray-900">
                          {expense.description}
                        </td>
                        <td className="py-2 px-4 text-gray-900">
                          ₹{(expense.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-2 px-4 text-gray-500">
                          {expense.date}
                        </td>
                        <td className="py-2 px-4">
                          {expense.can_import ? (
                            <span className="badge badge-success">Ready</span>
                          ) : (
                            <span className="badge badge-error">Blocked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <button onClick={handleReset} className="btn-secondary">
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Over
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={
                isLoading ||
                anomalies.some(
                  (a) =>
                    (a.severity === 'critical' || a.severity === 'error') &&
                    !resolvedAnomalies[a.id]
                )
              }
              className="btn-primary"
            >
              {isLoading ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Completed */}
      {currentStep === 3 && importData?.summary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Import Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            Successfully imported {importData.summary.importedCount} expenses
          </p>

          <div className="inline-flex gap-4">
            <button onClick={handleReset} className="btn-secondary">
              Import More
            </button>
            <button
              onClick={() => navigate(`/groups/${groupId}`)}
              className="btn-primary"
            >
              View Expenses
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImportPage;
