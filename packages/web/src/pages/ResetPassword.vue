<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiClient } from '../api/client';
import { useNotificationsStore } from '../stores/notifications';

const router = useRouter();
const route = useRoute();
const notify = useNotificationsStore();

const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

onMounted(() => {
  if (route.query.token) {
    token.value = route.query.token as string;
  } else {
    notify.error('Lien de réinitialisation invalide.');
    router.push('/login');
  }
});

const onSubmit = async () => {
  if (!password.value || password.value !== confirmPassword.value) {
    notify.error('Les mots de passe ne correspondent pas.');
    return;
  }
  if (password.value.length < 6) {
    notify.error('Le mot de passe doit faire au moins 6 caractères.');
    return;
  }
  
  isLoading.value = true;
  try {
    await apiClient.post('/auth/reset-password', { 
      token: token.value, 
      newPassword: password.value 
    });
    notify.success('Votre mot de passe a été réinitialisé avec succès !');
    router.push('/login');
  } catch (error: any) {
    notify.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-10 relative z-10 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
      
      <div class="text-center mb-10">
        <div class="mx-auto w-32 h-32 mb-6 flex items-center justify-center">
          <img src="/logo.png" alt="GMBoutique Logo" class="w-full h-full object-contain" />
        </div>
        <h2 class="text-xl font-bold text-black tracking-[0.2em] uppercase">Nouveau mot de passe</h2>
        <p class="mt-4 text-sm text-gray-500">Veuillez entrer votre nouveau mot de passe ci-dessous.</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <div>
          <label for="password" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nouveau mot de passe</label>
          <input 
            id="password" 
            type="password" 
            v-model="password" 
            required
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 outline-none text-sm rounded-xl"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Confirmer le mot de passe</label>
          <input 
            id="confirmPassword" 
            type="password" 
            v-model="confirmPassword" 
            required
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 outline-none text-sm rounded-xl"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading || !password || password !== confirmPassword"
          class="w-full py-4 px-4 bg-black hover:bg-gray-900 text-white font-bold uppercase tracking-[0.15em] text-xs transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl shadow-lg mt-8"
        >
          <span v-if="isLoading">Enregistrement...</span>
          <span v-else>Sauvegarder</span>
        </button>

        <div class="text-center mt-6">
          <router-link to="/login" class="text-xs text-gray-500 hover:text-black hover:underline font-medium">
            Annuler
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
