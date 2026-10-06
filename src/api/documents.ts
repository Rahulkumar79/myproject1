import { apiClient } from './client';

export const documentsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/documents');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/documents/${id}`);
    return data;
  },
  uploadFile: async (formData: FormData) => {
    const { data } = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  upload: async (formData: FormData) => {
    const { data } = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
  uploadTextMaterial: async (payload: { title: string; subject: string; customText: string }) => {
    const { data } = await apiClient.post('/documents/upload', payload);
    return data;
  },
  askRAG: async (payload: { documentId?: string; question: string }) => {
    const { data } = await apiClient.post('/documents/ask', payload);
    return data;
  },
  ask: async (payload: { documentId?: string; question: string }) => {
    const { data } = await apiClient.post('/documents/ask', payload);
    return data;
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/documents/${id}`);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/documents/${id}`);
    return data;
  },
};
