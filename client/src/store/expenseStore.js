import { create } from 'zustand';
import { expensesAPI, balancesAPI, settlementsAPI } from '../api';

const useExpenseStore = create((set, get) => ({
  expenses: [],
  currentExpense: null,
  balances: [],
  settlements: [],
  settlementSuggestions: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  },
  isLoading: false,
  error: null,

  fetchExpenses: async (groupId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.getAll(groupId, params);
      set({
        expenses: response.data.expenses || [],
        pagination: response.data.pagination,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to fetch expenses',
        isLoading: false,
      });
    }
  },

  createExpense: async (groupId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.create(groupId, data);
      const newExpense = response.data.expense;
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        isLoading: false,
      }));
      return { success: true, expense: newExpense };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create expense';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateExpense: async (groupId, expenseId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await expensesAPI.update(groupId, expenseId, data);
      set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === expenseId ? response.data.expense : e
        ),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update expense';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteExpense: async (groupId, expenseId) => {
    set({ isLoading: true, error: null });
    try {
      await expensesAPI.delete(groupId, expenseId);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== expenseId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete expense';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchBalances: async (groupId) => {
    try {
      const response = await balancesAPI.get(groupId);
      set({ balances: response.data.balances || [] });
      return response.data.balances;
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      return [];
    }
  },

  fetchSettlementSuggestions: async (groupId) => {
    try {
      const response = await balancesAPI.getSettlementSuggestions(groupId);
      set({ settlementSuggestions: response.data.settlements || [] });
      return response.data.settlements;
    } catch (error) {
      console.error('Failed to fetch settlement suggestions:', error);
      return [];
    }
  },

  fetchSettlements: async (groupId, params = {}) => {
    try {
      const response = await settlementsAPI.getAll(groupId, params);
      set({ settlements: response.data.settlements || [] });
      return response.data.settlements;
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      return [];
    }
  },

  createSettlement: async (groupId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await settlementsAPI.create(groupId, data);
      const newSettlement = response.data.settlement;
      set((state) => ({
        settlements: [newSettlement, ...state.settlements],
        isLoading: false,
      }));
      // Refresh balances
      await get().fetchBalances(groupId);
      await get().fetchSettlementSuggestions(groupId);
      return { success: true, settlement: newSettlement };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create settlement';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearExpenses: () =>
    set({
      expenses: [],
      balances: [],
      settlements: [],
      settlementSuggestions: [],
    }),
  clearError: () => set({ error: null }),
}));

export default useExpenseStore;
