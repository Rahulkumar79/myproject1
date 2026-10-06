import { apiClient } from './client';

export const studySessionsApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/study-sessions');
    return data;
  },
  getSummary: async () => {
    const { data } = await apiClient.get('/study-sessions/summary');
    return data;
  },
  create: async (payload: {
    subject: string;
    topic?: string;
    duration: number;
    startTime?: string;
    endTime?: string;
    activityType?: string;
    notes?: string;
  }) => {
    const { data } = await apiClient.post('/study-sessions', payload);
    return data;
  },
};
