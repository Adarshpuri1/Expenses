import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          const { user, accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register({ name, email, password });
          const { user, accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        }
      },

      refreshSession: async () => {
        try {
          const response = await authAPI.refresh();
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          set({ accessToken });
          return true;
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await authAPI.getMe();
          const { user } = response.data;
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return user;
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return null;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);

export default useAuthStore;
