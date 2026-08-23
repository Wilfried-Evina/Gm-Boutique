<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '../api/client';
import { useNotificationsStore } from '../stores/notifications';

const notify = useNotificationsStore();
const email = ref('');
const isLoading = ref(false);
const isSuccess = ref(false);

const onSubmit = async () => {
  if (!email.value) return;
  
  isLoading.value = true;
  try {
    await apiClient.post('/auth/forgot-password', { email: email.value });
    isSuccess.value = true;
    notify.success('Si votre compte existe, un email a été envoyé.');
  } catch (error: any) {
    notify.error(error.response?.data?.message || 'Erreur lors de la demande');
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
        <h2 class="text-xl font-bold text-black tracking-[0.2em] uppercase">Mot de passe oublié</h2>
        <p class="mt-4 text-sm text-gray-500">Entrez votre adresse email. Si elle correspond à un compte, nous vous enverrons un lien de réinitialisation.</p>
      </div>

      <div v-if="isSuccess" class="text-center space-y-6">
        <div class="p-4 bg-green-50 text-green-700 rounded-xl font-medium text-sm border border-green-100">
          Un email a été envoyé à <strong>{{ email }}</strong> s'il existe dans notre système.
        </div>
        <router-link to="/login" class="block w-full py-4 px-4 bg-gray-100 hover:bg-gray-200 text-black font-bold uppercase tracking-[0.15em] text-xs transition-all duration-300 rounded-xl">
          Retour à la connexion
        </router-link>
      </div>

      <form v-else @submit.prevent="onSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Adresse Email</label>
          <input 
            id="email" 
            type="email" 
            v-model="email" 
            required
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 outline-none text-sm rounded-xl"
            placeholder="exemple@gmail.com"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading || !email"
          class="w-full py-4 px-4 bg-black hover:bg-gray-900 text-white font-bold uppercase tracking-[0.15em] text-xs transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl shadow-lg mt-8"
        >
          <span v-if="isLoading">Envoi en cours...</span>
          <span v-else>Envoyer le lien</span>
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
