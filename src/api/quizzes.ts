import { apiClient } from './client';

export const quizzesApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/quizzes');
    return data;
  },
  generate: async (payload: {
    subject: string;
    topic: string;
    difficulty: string;
    questionCount: number;
    questionType: string;
    title?: string;
  }) => {
    const { data } = await apiClient.post('/quizzes/generate', payload);
    return data;
  },
  getByIdForTaking: async (id: string) => {
    const { data } = await apiClient.get(`/quizzes/${id}`);
    return data;
  },
  getForTaking: async (id: string) => {
    const { data } = await apiClient.get(`/quizzes/${id}`);
    return data;
  },
  submitAttempt: async (
    id: string,
    payload: {
      answers: Array<{ questionId: string; userAnswer: string }> | Record<string, string>;
      timeSpentSeconds: number;
    }
  ) => {
    const { data } = await apiClient.post(`/quizzes/${id}/submit`, payload);
    return data;
  },
  getResult: async (id: string, attemptId?: string) => {
    const { data } = await apiClient.get(`/quizzes/${id}/result`, {
      params: attemptId ? { attemptId } : undefined,
    });
    return data;
  },
};
