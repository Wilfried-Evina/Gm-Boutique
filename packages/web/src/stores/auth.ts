import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import axios from 'axios';
import { apiClient } from '../api/client';
import { isTokenExpired } from '../utils/jwt';
import type { IUser } from '@gm-boutique/shared';

const ACCESS_KEY = 'access_token';
// NOTE sécurité : idéalement le refresh token serait stocké dans un cookie httpOnly.
// Le backend actuel le renvoie dans le corps de la réponse, on le conserve donc en
// localStorage pour que le rafraîchissement fonctionne réellement.
const REFRESH_KEY = 'refresh_token';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<IUser | null>(null);
  const token = ref<string | null>(localStorage.getItem(ACCESS_KEY));
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
  // Passe à true une fois la vérification de session au démarrage terminée.
  const ready = ref(false);

  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value));

  function setTokens(access: string, refresh?: string) {
    token.value = access;
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) {
      refreshToken.value = refresh;
      localStorage.setItem(REFRESH_KEY, refresh);
    }
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    refreshToken.value = null;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  /** Connexion : récupère et stocke les tokens + le profil. */
  async function login(email: string, password: string) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    user.value = data.user ?? null;
    return user.value;
  }

  /** Déconnexion locale (pas d'endpoint serveur dédié). */
  function logout() {
    clearAuth();
  }

  /** Rafraîchit l'access token via le refresh token. Retourne true si succès. */
  async function refresh(): Promise<boolean> {
    const rt = refreshToken.value ?? localStorage.getItem(REFRESH_KEY);
    if (!rt) return false;
    try {
      // axios brut pour éviter la récursion avec l'intercepteur d'apiClient.
      const { data } = await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        { refreshToken: rt },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  /** Charge le profil courant ; nettoie la session si le token est invalide. */
  async function fetchProfile() {
    if (!token.value) return;
    try {
      const { data } = await apiClient.get('/auth/me');
      user.value = data;
    } catch {
      clearAuth();
    }
  }

  /** Vérifie la session au démarrage (validité + rafraîchissement si nécessaire). */
  async function initAuth() {
    if (ready.value) return;
    try {
      if (token.value) {
        if (isTokenExpired(token.value)) {
          const ok = await refresh();
          if (!ok) {
            clearAuth();
            return;
          }
        }
        await fetchProfile();
      }
    } finally {
      ready.value = true;
    }
  }

  return {
    user,
    token,
    refreshToken,
    ready,
    isAuthenticated,
    setTokens,
    clearAuth,
    login,
    logout,
    refresh,
    fetchProfile,
    initAuth,
  };
});
