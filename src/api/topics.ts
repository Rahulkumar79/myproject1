import { apiClient } from './client';

export const topicsApi = {
  getAll: async (params?: { subject?: string; difficulty?: string; search?: string }) => {
    const { data } = await apiClient.get('/topics', { params });
    return data;
  },
  getBySubject: async (subjectId: string) => {
    const { data } = await apiClient.get(`/subjects/${encodeURIComponent(subjectId)}/topics`);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/topics/${id}`);
    return data;
  },
  create: async (payload: Record<string, any>) => {
    const { data } = await apiClient.post('/topics', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/topics/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/topics/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/topics/${id}`);
    return data;
  },
};
