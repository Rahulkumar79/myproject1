import { apiClient } from './client';

export const studyTasksApi = {
  getAll: async (params?: { studyPlan?: string; status?: string; priority?: string }) => {
    const { data } = await apiClient.get('/study-tasks', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/study-tasks/${id}`);
    return data;
  },
  create: async (payload: Record<string, any>) => {
    const { data } = await apiClient.post('/study-tasks', payload);
    return data;
  },
  update: async (id: string, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/study-tasks/${id}`, payload);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/study-tasks/${id}/status`, { status });
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/study-tasks/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/study-tasks/${id}`);
    return data;
  },
};
