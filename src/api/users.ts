import { apiClient } from './client';

export const usersApi = {
  getProfile: async () => {
    const { data } = await apiClient.get('/users/me');
    return data;
  },
  updateProfile: async (payload: Record<string, any>) => {
    const { data } = await apiClient.put('/users/me', payload);
    return data;
  },
  updatePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const { data } = await apiClient.put('/users/me/password', payload);
    return data;
  },
};
