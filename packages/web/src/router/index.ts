import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppLayout from '../layouts/AppLayout.vue';
import Dashboard from '../pages/Dashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Dashboard', component: Dashboard },
        // On ajoutera ici les futures pages Clientes et Articles
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

// Guard global pour protéger les routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.token) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
