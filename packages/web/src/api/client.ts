import axios from 'axios';

// Si on accède au site via l'IP réseau (depuis un téléphone par ex.),
// l'API doit aussi être contactée via cette même IP.
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  const hostname = window.location.hostname;
  // Si on est sur localhost, on cible localhost:5000
  // Si on est sur une IP réseau (ex: 192.168.1.43), on cible cette IP:5000
  return `http://${hostname}:5000/api`;
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
