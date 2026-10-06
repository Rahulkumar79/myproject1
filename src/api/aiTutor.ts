import { apiClient } from './client';

export const aiTutorApi = {
  getConversations: async () => {
    const { data } = await apiClient.get('/ai-tutor/conversations');
    return data;
  },
  createConversation: async (payload: {
    title?: string;
    mode?: string;
    subject?: string;
    topic?: string;
  }) => {
    const { data } = await apiClient.post('/ai-tutor/conversations', payload);
    return data;
  },
  getConversationById: async (id: string) => {
    const { data } = await apiClient.get(`/ai-tutor/conversations/${id}`);
    return data;
  },
  updateConversation: async (id: string, payload: Record<string, any>) => {
    const { data } = await apiClient.put(`/ai-tutor/conversations/${id}`, payload);
    return data;
  },
  deleteConversation: async (id: string) => {
    const { data } = await apiClient.delete(`/ai-tutor/conversations/${id}`);
    return data;
  },
  clearMessages: async (id: string) => {
    const { data } = await apiClient.delete(`/ai-tutor/conversations/${id}/messages`);
    return data;
  },
  sendMessage: async (
    id: string,
    payload: { content: string; mode?: string; subject?: string; topic?: string }
  ) => {
    const { data } = await apiClient.post(`/ai-tutor/conversations/${id}/messages`, payload);
    return data;
  },
};
