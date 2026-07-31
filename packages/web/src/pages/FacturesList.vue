<template>
  <div class="h-full flex flex-col p-6 max-w-7xl mx-auto w-full">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-gray-900">Factures & Bordereaux</h1>
        <p class="text-sm text-gray-500 mt-1">Historique complet des ventes et encaissements</p>
      </div>
      
      <button @click="openHistoricalGodMode" class="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
        Digitaliser une ancienne facture
      </button>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
      <div class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/50">
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Référence</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Date</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Articles</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Paiement</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase text-right">Total (CHF)</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="isLoading" class="animate-pulse">
              <td colspan="6" class="py-12 text-center text-gray-400">Chargement de l'historique...</td>
            </tr>
            <tr v-else-if="sales.length === 0">
              <td colspan="6" class="py-12 text-center text-gray-400">Aucune vente enregistrée pour le moment.</td>
            </tr>
            <tr v-else v-for="sale in sales" :key="sale._id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="py-4 px-6">
                <span class="font-bold font-mono text-gray-900">{{ sale.reference }}</span>
              </td>
              <td class="py-4 px-6 text-sm text-gray-600">
                {{ formatDate(sale.createdAt) }}
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {{ sale.articles.length }} article(s)
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="text-sm text-gray-600 capitalize">{{ formatPaymentMethod(sale.paymentMethod) }}</span>
              </td>
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-gray-900">{{ sale.totalAmount.toFixed(2) }}</span>
              </td>
              <td class="py-4 px-6 text-right">
                <button @click="openReceipt(sale)" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end w-full gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  Voir Bordereau
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Receipt Modal -->
    <ReceiptPreviewModal 
      :is-open="isReceiptOpen"
      :sale="selectedSale"
      @close="closeReceipt"
    />

    <!-- Historical God Mode Modal -->
    <HistoricalGodModeModal 
      :is-open="isGodModeOpen"
      @close="isGodModeOpen = false"
      @saved="handleHistoricalSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { salesApi } from '../api/sales';
import type { ISale } from '@gm-boutique/shared';
import ReceiptPreviewModal from '../components/pos/ReceiptPreviewModal.vue';
import HistoricalGodModeModal from '../components/pos/HistoricalGodModeModal.vue';
import { useNotificationsStore } from '../stores/notifications';

const sales = ref<ISale[]>([]);
const isLoading = ref(true);
const notifications = useNotificationsStore();

const isReceiptOpen = ref(false);
const selectedSale = ref<ISale | null>(null);

const isGodModeOpen = ref(false);

const openHistoricalGodMode = () => {
  isGodModeOpen.value = true;
};

const handleHistoricalSaved = (sale: ISale) => {
  // Add to the top of the list or refresh
  fetchSales();
};

const fetchSales = async () => {
  isLoading.value = true;
  try {
    sales.value = await salesApi.getAll();
  } catch (err) {
    notifications.error('Erreur lors du chargement des factures');
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('fr-CH', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));
};

const formatPaymentMethod = (method: string) => {
  const methods: Record<string, string> = {
    card: 'Carte Bancaire',
    cash: 'Espèces',
    twint: 'TWINT'
  };
  return methods[method] || method;
};

const openReceipt = (sale: ISale) => {
  selectedSale.value = sale;
  isReceiptOpen.value = true;
};

const closeReceipt = () => {
  isReceiptOpen.value = false;
  setTimeout(() => {
    selectedSale.value = null;
  }, 200);
};

onMounted(() => {
  fetchSales();
});
</script>
