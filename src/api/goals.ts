import { apiClient } from './client';

export const goalsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/goals');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/goals/${id}`);
    return data;
  },
  create: async (payload: Record<string, any>) => {
    const { data } = await apiClient.post('/goals', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/goals/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/goals/${id}`);
    return data;
  },
};
