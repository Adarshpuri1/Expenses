import { create } from 'zustand';
import { importAPI } from '../api';

const useImportStore = create((set, get) => ({
  importSessionId: null,
  importData: null,
  anomalies: [],
  previewExpenses: [],
  memberList: [],
  summary: null,
  history: [],
  currentStep: 1, // 1: Upload, 2: Review, 3: Confirm
  isUploading: false,
  isLoading: false,
  error: null,

  uploadCsv: async (groupId, formData) => {
    set({ isUploading: true, error: null });
    try {
      const response = await importAPI.upload(groupId, formData);
      const {
        importSessionId,
        totalRows,
        summary,
        anomalies,
        previewExpenses,
        memberList,
      } = response.data;

      set({
        importSessionId,
        importData: response.data,
        anomalies: anomalies || [],
        previewExpenses: previewExpenses || [],
        memberList: memberList || [],
        summary: summary || { totalRows, cleanRows: 0, criticalCount: 0, warningCount: 0 },
        currentStep: 2,
        isUploading: false,
      });

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to upload CSV';
      set({ error: message, isUploading: false });
      return { success: false, error: message };
    }
  },

  resolveAnomaly: async (groupId, anomalyId, action) => {
    try {
      await importAPI.resolveAnomaly(
        groupId,
        get().importSessionId,
        anomalyId,
        action
      );
      // Update local anomaly state
      set((state) => ({
        anomalies: state.anomalies.map((a) =>
          a.id === anomalyId ? { ...a, actionTaken: action } : a
        ),
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resolve anomaly',
      };
    }
  },

  confirmImport: async (groupId, rowSelection = null, memberMapping = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await importAPI.confirm(groupId, get().importSessionId, {
        rowSelection,
        memberMapping,
      });

      set({
        currentStep: 3,
        isLoading: false,
        importData: {
          ...get().importData,
          summary: response.data.summary,
          errors: response.data.errors,
          currencyConversions: response.data.currencyConversions,
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to confirm import';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchImportHistory: async (groupId) => {
    try {
      const response = await importAPI.getHistory(groupId);
      set({ history: response.data.importSessions || [] });
      return response.data.importSessions;
    } catch (error) {
      console.error('Failed to fetch import history:', error);
      return [];
    }
  },

  fetchImportSession: async (groupId, sessionId) => {
    set({ isLoading: true });
    try {
      const response = await importAPI.getSession(groupId, sessionId);
      const session = response.data.importSession;
      set({
        importSessionId: session.id,
        importData: session.report_json,
        anomalies: session.anomalies || [],
        summary: session.report_json?.anomalySummary,
        isLoading: false,
      });
      return session;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch import session' });
      return null;
    }
  },

  reset: () =>
    set({
      importSessionId: null,
      importData: null,
      anomalies: [],
      previewExpenses: [],
      memberList: [],
      summary: null,
      currentStep: 1,
      isUploading: false,
      isLoading: false,
      error: null,
    }),

  setCurrentStep: (step) => set({ currentStep: step }),
  clearError: () => set({ error: null }),
}));

export default useImportStore;
