import axios from 'axios';

// Si on accède au site via l'IP réseau (depuis un téléphone par ex.),
// l'API doit passer par le proxy Vite (port 5173) pour éviter le blocage du port 5000 par macOS.
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  // Utilise l'origine actuelle (ex: http://192.168.1.43:5173) pour que le proxy Vite prenne le relais
  return `${window.location.origin}/api`;
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor pour rafraîchir le token automatiquement sur 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;

      // Import différé du store pour éviter les dépendances circulaires.
      const { useAuthStore } = await import('../stores/auth');
      const authStore = useAuthStore();

      const refreshed = await authStore.refresh();
      if (refreshed && authStore.token) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`;
        return apiClient(originalRequest);
      }

      // Échec du rafraîchissement : on nettoie et on renvoie vers la connexion.
      authStore.logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
