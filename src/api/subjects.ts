import { apiClient } from './client';

export const subjectsApi = {
  getAll: async (params?: { category?: string; difficulty?: string; search?: string }) => {
    const { data } = await apiClient.get('/subjects', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/subjects/${encodeURIComponent(id)}`);
    return data;
  },
  create: async (payload: Record<string, any>) => {
    const { data } = await apiClient.post('/subjects', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/subjects/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/subjects/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/subjects/${id}`);
    return data;
  },
};
