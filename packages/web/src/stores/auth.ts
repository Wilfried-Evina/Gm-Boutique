import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiClient } from '../api/client';
import type { IUser } from '@gm-boutique/shared';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<IUser | null>(null);
  const token = ref<string | null>(localStorage.getItem('access_token'));

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('access_token', newToken);
  };

  const clearAuth = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('access_token');
  };

  const fetchProfile = async () => {
    if (!token.value) return;
    try {
      const response = await apiClient.get('/auth/me');
      user.value = response.data;
    } catch (error) {
      clearAuth();
    }
  };

  return {
    user,
    token,
    setToken,
    clearAuth,
    fetchProfile,
  };
});
