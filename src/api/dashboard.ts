import { apiClient } from './client';

export const dashboardApi = {
  getStudentDashboard: async () => {
    const { data } = await apiClient.get('/dashboard');
    return data;
  },
};
