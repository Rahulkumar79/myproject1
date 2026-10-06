import { apiClient } from './client';

export const authApi = {
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    educationLevel?: string;
    college?: string;
    subjects?: string[];
    learningGoals?: string[];
    preferredStudyHours?: number;
  }) => {
    const { data } = await apiClient.post('/auth/register', payload);
    return data;
  },
  login: async (payload: { email: string; password: string }) => {
    const { data } = await apiClient.post('/auth/login', payload);
    return data;
  },
  logout: async () => {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
