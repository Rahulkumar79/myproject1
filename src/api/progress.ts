import { apiClient } from './client';

export const progressApi = {
  getOverview: async () => {
    const { data } = await apiClient.get('/progress');
    return data;
  },
  getSubjects: async () => {
    const { data } = await apiClient.get('/progress/subjects');
    return data;
  },
  getTopics: async () => {
    const { data } = await apiClient.get('/progress/topics');
    return data;
  },
  getBySubject: async (subjectId: string) => {
    const { data } = await apiClient.get(`/progress/${encodeURIComponent(subjectId)}`);
    return data;
  },
  markTopicStudied: async (payload: {
    subject: string;
    topic: string;
    completionPercentage?: number;
    durationMinutes?: number;
    studyTimeMinutes?: number;
  }) => {
    const { data } = await apiClient.post('/progress/mark-topic', payload);
    return data;
  },
};
