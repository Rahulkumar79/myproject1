import { apiClient } from './client';

export const studyPlansApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/study-plans');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/study-plans/${id}`);
    return data;
  },
  create: async (payload: Record<string, any>) => {
    const { data } = await apiClient.post('/study-plans', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/study-plans/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/study-plans/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/study-plans/${id}`);
    return data;
  },
};
