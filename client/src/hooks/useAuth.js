// Custom hooks
export function useAuth() {
  const { useAuthStore } = require('../store');
  return useAuthStore();
}

export function useGroup() {
  const { useGroupStore } = require('../store');
  return useGroupStore();
}

export function useExpense() {
  const { useExpenseStore } = require('../store');
  return useExpenseStore();
}

export function useImport() {
  const { useImportStore } = require('../store');
  return useImportStore();
}
