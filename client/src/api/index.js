import apiClient from './client';

// Auth API
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  logoutAll: () => apiClient.post('/auth/logout-all'),
  refresh: () => apiClient.post('/auth/refresh'),
  getMe: () => apiClient.get('/auth/me'),
};

// Groups API
export const groupsAPI = {
  create: (data) => apiClient.post('/groups', data),
  getAll: () => apiClient.get('/groups'),
  getById: (id) => apiClient.get(`/groups/${id}`),
  update: (id, data) => apiClient.put(`/groups/${id}`, data),
  delete: (id) => apiClient.delete(`/groups/${id}`),
  getMembers: (id, at) => {
    const params = new URLSearchParams();
    if (at) params.append('at', at);
    return apiClient.get(`/groups/${id}/members?${params}`);
  },
  addMember: (groupId, userId) => apiClient.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) => apiClient.delete(`/groups/${groupId}/members/${userId}`),
  getStats: (id) => apiClient.get(`/groups/${id}/stats`),
};

// Expenses API
export const expensesAPI = {
  create: (groupId, data) => apiClient.post(`/groups/${groupId}/expenses`, data),
  getAll: (groupId, params) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page);
    if (params?.limit) searchParams.append('limit', params.limit);
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    return apiClient.get(`/groups/${groupId}/expenses?${searchParams}`);
  },
  getById: (groupId, expenseId) => apiClient.get(`/groups/${groupId}/expenses/${expenseId}`),
  update: (groupId, expenseId, data) => apiClient.put(`/groups/${groupId}/expenses/${expenseId}`, data),
  delete: (groupId, expenseId) => apiClient.delete(`/groups/${groupId}/expenses/${expenseId}`),
};

// Balances API
export const balancesAPI = {
  get: (groupId) => apiClient.get(`/groups/${groupId}/balances`),
  getSettlementSuggestions: (groupId) => apiClient.get(`/groups/${groupId}/settlement-suggestions`),
};

// Settlements API
export const settlementsAPI = {
  create: (groupId, data) => apiClient.post(`/groups/${groupId}/settlements`, data),
  getAll: (groupId, params) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page);
    if (params?.limit) searchParams.append('limit', params.limit);
    return apiClient.get(`/groups/${groupId}/settlements?${searchParams}`);
  },
  getById: (groupId, settlementId) => apiClient.get(`/groups/${groupId}/settlements/${settlementId}`),
  delete: (groupId, settlementId) => apiClient.delete(`/groups/${groupId}/settlements/${settlementId}`),
};

// Import API
export const importAPI = {
  upload: (groupId, formData) => apiClient.post(`/groups/${groupId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  confirm: (groupId, sessionId, data) => apiClient.post(`/groups/${groupId}/import/${sessionId}/confirm`, data),
  getSession: (groupId, sessionId) => apiClient.get(`/groups/${groupId}/import/${sessionId}`),
  getHistory: (groupId) => apiClient.get(`/groups/${groupId}/import-history`),
  resolveAnomaly: (groupId, sessionId, anomalyId, action) =>
    apiClient.post(`/groups/${groupId}/import/${sessionId}/anomalies/${anomalyId}`, { action }),
};

// Users API (for finding users to add to groups)
export const usersAPI = {
  search: (query) => {
    // This would typically be a search endpoint
    // For now returning a simple implementation
    return apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
  },
};

export default {
  auth: authAPI,
  groups: groupsAPI,
  expenses: expensesAPI,
  balances: balancesAPI,
  settlements: settlementsAPI,
  import: importAPI,
  users: usersAPI,
};
