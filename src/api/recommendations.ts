import { apiClient } from './client';

export const recommendationsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/recommendations');
    return data;
  },
  refresh: async () => {
    const { data } = await apiClient.post('/recommendations/refresh');
    return data;
  },
  updateStatus: async (id: string, status: 'active' | 'completed' | 'dismissed') => {
    const { data } = await apiClient.patch(`/recommendations/${id}/status`, { status });
    return data;
  },
};

export const searchApi = {
  query: async (q: string, type = 'all') => {
    const { data } = await apiClient.get('/search', { params: { q, type } });
    return data;
  },
  globalSearch: async (q: string, type = 'all') => {
    const { data } = await apiClient.get('/search', { params: { q, type } });
    return data;
  },
};

export const activitiesApi = {
  getAll: async (type?: string) => {
    const { data } = await apiClient.get('/activities', { params: type ? { type } : undefined });
    return data;
  },
  getRecent: async () => {
    const { data } = await apiClient.get('/activities/recent');
    return data;
  },
};

export const adminApi = {
  getOverview: async () => {
    const { data } = await apiClient.get('/admin/overview');
    return data;
  },
  getUsers: async () => {
    const { data } = await apiClient.get('/admin/users');
    return data;
  },
  toggleUserStatus: async (id: string, isActive: boolean) => {
    const { data } = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
    return data;
  },
  getUserActivity: async (id: string) => {
    const { data } = await apiClient.get(`/admin/users/${id}/activity`);
    return data;
  },
  getDocuments: async () => {
    const { data } = await apiClient.get('/admin/documents');
    return data;
  },
  deleteDocument: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/documents/${id}`);
    return data;
  },
};
