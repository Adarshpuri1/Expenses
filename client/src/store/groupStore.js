import { create } from 'zustand';
import { groupsAPI } from '../api';

const useGroupStore = create((set, get) => ({
  groups: [],
  currentGroup: null,
  members: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupsAPI.getAll();
      set({
        groups: response.data.groups || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to fetch groups',
        isLoading: false,
      });
    }
  },

  fetchGroupById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupsAPI.getById(id);
      set({
        currentGroup: response.data.group,
        isLoading: false,
      });
      return response.data.group;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to fetch group',
        isLoading: false,
      });
      return null;
    }
  },

  createGroup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupsAPI.create(data);
      const newGroup = response.data.group;
      set((state) => ({
        groups: [...state.groups, newGroup],
        isLoading: false,
      }));
      return { success: true, group: newGroup };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create group';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateGroup: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupsAPI.update(id, data);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === id ? response.data.group : g)),
        currentGroup: response.data.group,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update group';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await groupsAPI.delete(id);
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        currentGroup: state.currentGroup?.id === id ? null : state.currentGroup,
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete group';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchMembers: async (groupId, atDate = null) => {
    try {
      const response = await groupsAPI.getMembers(groupId, atDate);
      set({ members: response.data.members || [] });
      return response.data.members;
    } catch (error) {
      console.error('Failed to fetch members:', error);
      return [];
    }
  },

  addMember: async (groupId, userId) => {
    try {
      await groupsAPI.addMember(groupId, userId);
      // Refresh members
      await get().fetchMembers(groupId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add member',
      };
    }
  },

  removeMember: async (groupId, userId) => {
    try {
      await groupsAPI.removeMember(groupId, userId);
      await get().fetchMembers(groupId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove member',
      };
    }
  },

  fetchStats: async (groupId) => {
    try {
      const response = await groupsAPI.getStats(groupId);
      set({ stats: response.data.stats });
      return response.data.stats;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  },

  clearCurrentGroup: () => set({ currentGroup: null, members: [], stats: null }),
  clearError: () => set({ error: null }),
}));

export default useGroupStore;
