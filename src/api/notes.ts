import { apiClient } from './client';

export const notesApi = {
  getAll: async (params?: { subject?: string; difficulty?: string; search?: string }) => {
    const { data } = await apiClient.get('/notes', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/notes/${id}`);
    return data;
  },
  generate: async (payload: {
    subject: string;
    topic: string;
    difficulty: string;
    length: string;
    title?: string;
  }) => {
    const { data } = await apiClient.post('/notes/generate', payload);
    return data;
  },
  update: async (id: string, payload: { title?: string; content?: string; difficulty?: string }) => {
    const { data } = await apiClient.put(`/notes/${id}`, payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/notes/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/notes/${id}`);
    return data;
  },
};
