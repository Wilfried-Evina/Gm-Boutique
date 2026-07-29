<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="h-16 flex items-center justify-center border-b border-gray-200">
        <h1 class="text-xl font-bold tracking-widest uppercase">GM Boutique</h1>
      </div>
      <nav class="flex-1 p-4 space-y-2">
        <router-link to="/" class="block px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-black">
          Tableau de bord
        </router-link>
        <router-link to="/clients" class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          Clientes
        </router-link>
        <router-link to="/articles" class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          Articles & Dépôts
        </router-link>
      </nav>
      <div class="p-4 border-t border-gray-200">
        <button @click="handleLogout" class="w-full px-4 py-2 text-left text-sm font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
        <div class="flex items-center space-x-3">
          <span class="text-sm font-medium text-gray-700">{{ authStore.user?.email || 'Gérante' }}</span>
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            G
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-6">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>
