import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppLayout from '../layouts/AppLayout.vue';
import Dashboard from '../pages/Dashboard.vue';

const Placeholder = () => import('../pages/Placeholder.vue');
const ClientsList = () => import('../pages/clients/ClientsList.vue');
const ClientDetail = () => import('../pages/clients/ClientDetail.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Dashboard', component: Dashboard, meta: { title: 'Tableau de bord' } },
        { path: 'alertes', name: 'Alertes', component: Placeholder, meta: { title: 'Alertes' } },
        { path: 'clients', name: 'Clientes', component: ClientsList, meta: { title: 'Clientes' } },
        { path: 'clients/:id', name: 'ClientDetail', component: ClientDetail, meta: { title: 'Fiche cliente' } },
        { path: 'articles', name: 'Articles', component: Placeholder, meta: { title: 'Articles & Dépôts' } },
        { path: 'retrocessions', name: 'Retrocessions', component: Placeholder, meta: { title: 'Rétrocessions' } },
        { path: 'documents', name: 'Documents', component: Placeholder, meta: { title: 'Documents' } },
        { path: 'settings', name: 'Parametres', component: Placeholder, meta: { title: 'Paramètres' } },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/Login.vue'), 
      meta: { requiresAuth: false },
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('../pages/Forbidden.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../pages/NotFound.vue'),
      meta: { requiresAuth: false },
    }
  ],
});

// Guard global : vérification de session au démarrage + protection des routes
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Vérifie la validité de la session une seule fois au démarrage.
  if (!authStore.ready) {
    await authStore.initAuth();
  }

  // Route protégée sans session valide → connexion (en gardant la destination).
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  // Déjà connecté et on tente d'aller sur /login → tableau de bord.
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { name: 'Dashboard' };
  }

  // Garde par rôle : la route déclare meta.roles, l'utilisateur doit en faire partie.
  const roles = to.meta.roles as string[] | undefined;
  if (roles?.length && authStore.user && !roles.includes(authStore.user.role)) {
    return { name: 'Forbidden' };
  }

  return true;
});

export default router;
