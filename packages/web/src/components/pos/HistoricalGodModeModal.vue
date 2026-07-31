<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div>
          <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Digitalisation d'Archive
          </h3>
          <p class="text-xs text-gray-500 mt-1">Crée la cliente, l'article et la vente en une seule fois.</p>
        </div>
        <button @click="close" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- CONTENT -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <form @submit.prevent="submit" id="god-form" class="space-y-8">
          
          <!-- SECTION 1: LA VENTE -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 class="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">1</span>
              La Vente
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date exacte de la vente</label>
                <input 
                  v-model="formattedDate" 
                  @input="formatDateInput"
                  type="text" 
                  placeholder="JJ/MM/AAAA"
                  maxlength="10"
                  required 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all font-mono"
                >
                <p class="text-xs text-gray-500 mt-1">Saisie rapide : tapez les chiffres sans les barres (ex: 15042024)</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Moyen de paiement</label>
                <select v-model="form.paymentMethod" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all bg-white">
                  <option value="card">Carte Bancaire</option>
                  <option value="cash">Espèces</option>
                  <option value="twint">TWINT</option>
                </select>
              </div>
            </div>
          </div>

          <!-- SECTION 2: LA CLIENTE -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 class="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">2</span>
              La Déposante (Cliente)
            </h4>
            <p class="text-xs text-gray-500 mb-4">Si l'email existe déjà, la vente sera rattachée à son profil. Sinon, elle sera créée.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input v-model="form.client.firstName" type="text" autocomplete="off" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input v-model="form.client.lastName" type="text" autocomplete="off" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-xs text-gray-400 font-normal">(Optionnel)</span></label>
                <input v-model="form.client.email" type="email" autocomplete="off" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input v-model="form.client.phone" type="tel" autocomplete="off" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
            </div>
          </div>

          <!-- SECTION 3: L'ARTICLE -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 class="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">3</span>
              L'Article Vendu
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                <input v-model="form.article.brand" type="text" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Type (ex: Veste)</label>
                <input v-model="form.article.type" type="text" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <input v-model="form.article.color" type="text" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-1">Prix de Vente (Public) en CHF</label>
                <input v-model.number="form.article.publicPrice" type="number" step="0.05" required class="w-full px-4 py-2 border-2 border-gray-900 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all text-lg font-mono">
              </div>
              <div>
                <label class="block text-sm font-bold text-emerald-600 mb-1">Gain Cliente (Restitué) en CHF</label>
                <input v-model.number="form.article.clientPrice" type="number" step="0.05" required class="w-full px-4 py-2 border-2 border-emerald-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg font-mono">
              </div>
            </div>
            <div class="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200">
              <span class="text-sm font-medium text-gray-600">Marge Nette GM Boutique calculée :</span>
              <span class="text-xl font-black text-indigo-600">{{ gmGain.toFixed(2) }} CHF</span>
            </div>
          </div>

        </form>
      </div>

      <!-- FOOTER (Actions) -->
      <div class="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
        <button type="button" @click="close" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors">
          Annuler
        </button>
        <button type="submit" form="god-form" :disabled="isSubmitting" class="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all shadow-md disabled:opacity-50">
          <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          {{ isSubmitting ? 'Digitalisation...' : 'Digitaliser l\'Archive' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { salesApi } from '../../api/sales';
import { useNotificationsStore } from '../../stores/notifications';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', sale: any): void;
}>();

const notifications = useNotificationsStore();
const isSubmitting = ref(false);
const formattedDate = ref('');

const getInitialForm = () => ({
  paymentMethod: 'card' as const,
  client: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  article: {
    brand: '',
    type: '',
    color: '',
    publicPrice: 0,
    clientPrice: 0,
  }
});

const form = ref(getInitialForm());

const gmGain = computed(() => {
  return (form.value.article.publicPrice || 0) - (form.value.article.clientPrice || 0);
});

const formatDateInput = (event: Event) => {
  let val = (event.target as HTMLInputElement).value;
  val = val.replace(/\D/g, ''); // Remove non-digits
  
  if (val.length >= 5) {
    formattedDate.value = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
  } else if (val.length >= 3) {
    formattedDate.value = `${val.slice(0, 2)}/${val.slice(2)}`;
  } else {
    formattedDate.value = val;
  }
};

const close = () => {
  form.value = getInitialForm();
  formattedDate.value = '';
  emit('close');
};

const submit = async () => {
  if (gmGain.value < 0) {
    notifications.error('Le gain GM Boutique ne peut pas être négatif.');
    return;
  }

  isSubmitting.value = true;
  try {
    // Parse JJ/MM/AAAA to ISO string
    const [day, month, year] = formattedDate.value.split('/');
    if (!day || !month || !year || year.length !== 4) {
      throw new Error("Le format de la date doit être JJ/MM/AAAA.");
    }
    
    // Use current time (HH:MM:SS) to keep them ordered by entry time instead of hardcoding 12:00
    const now = new Date();
    const timeString = now.toISOString().split('T')[1]; 
    const isoDate = new Date(`${year}-${month}-${day}T${timeString}`).toISOString();

    const sale = await salesApi.createHistoricalFull({
      date: isoDate,
      paymentMethod: form.value.paymentMethod,
      client: { ...form.value.client },
      article: { ...form.value.article }
    });
    notifications.success('Archive digitalisée avec succès !');
    emit('saved', sale);
    close();
  } catch (err: any) {
    notifications.error(err.response?.data?.message || 'Erreur lors de la création de la vente historique');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
