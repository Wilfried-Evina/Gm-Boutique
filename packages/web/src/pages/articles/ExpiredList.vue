<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Articles expirés</h1>
        <p class="mt-2 text-sm text-gray-700">Articles dont le délai de vente est dépassé et nécessitant une action.</p>
      </div>
      <!-- Les boutons d'action globaux ont été retirés -->
    </div>



    <!-- Table -->
    <DataTable
      :columns="columns"
      :rows="expiredArticles"
      :loading="isLoading"
      :total="expiredArticles.length"
      :page="1"
      :limit="expiredArticles.length"
    >
      <!-- Le code-barres n'est géré que depuis la page globale Articles -->

      <template #cell-clientId="{ row: item }">
        {{ item.clientId.firstName }} {{ item.clientId.lastName }}
      </template>

      <template #cell-price="{ row: item }">
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-gray-900">{{ item.publicPrice.toFixed(2) }} CHF <span class="font-normal text-xs text-gray-500">(Boutique)</span></span>
          <span class="text-xs text-gray-500">{{ item.clientPrice.toFixed(2) }} CHF (Gain Cliente)</span>
        </div>
      </template>

      <template #cell-actions="{ row: item }">
        <div class="flex justify-end space-x-2">
          <button @click="articleStore.changeStatus(item._id, 'returned')" class="text-xs font-medium text-orange-600 hover:text-orange-900">Restituer</button>
        </div>
      </template>
    </DataTable>

    <!-- Modals -->
    <ArticleFormModal 
      :is-open="isFormModalOpen" 
      @close="isFormModalOpen = false" 
      @saved="onArticleSaved" 
    />
    
    <BarcodePreviewModal 
      :is-open="isBarcodeModalOpen" 
      :barcode="selectedBarcode" 
      @close="isBarcodeModalOpen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useArticleStore } from '../../stores/articles';
import { articlesApi } from '../../api/articles';
import { listClients } from '../../api/clients';
import DataTable from '../../components/ui/DataTable.vue';
import ArticleFormModal from '../../components/articles/ArticleFormModal.vue';
import BarcodePreviewModal from '../../components/articles/BarcodePreviewModal.vue';

const route = useRoute();
const articleStore = useArticleStore();
const expiredArticles = ref<any[]>([]);
const isLoading = ref(false);

const isFormModalOpen = ref(false);
const isBarcodeModalOpen = ref(false);
const selectedBarcode = ref<string | null>(null);

const columns = [
  { key: 'barcode', label: 'Réf / Code-barres' },
  { key: 'brand', label: 'Marque' },
  { key: 'type', label: 'Type & Couleur', format: (_: any, item: any) => `${item.type} ${item.color}` },
  { key: 'clientId', label: 'Cliente' },
  { key: 'price', label: 'Prix' },
  { key: 'actions', label: '', align: 'right' as const }
];

const fetchExpired = async () => {
  isLoading.value = true;
  try {
    expiredArticles.value = await articlesApi.getExpired();
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchExpired();
});

const onArticleSaved = () => {
  fetchExpired();
};

const openBarcode = (barcode: string) => {
  selectedBarcode.value = barcode;
  isBarcodeModalOpen.value = true;
};

const openBarcodeScanner = () => {
  const code = prompt('Veuillez scanner ou taper le code-barres (GM-YYYY-XXXX) :');
  if (code) {
    // Si c'est un vrai scan, on pourrait appeler l'API et rediriger ou ouvrir une modale.
    // Pour la démo, on ouvre l'aperçu !
    openBarcode(code.trim().toUpperCase());
  }
};

const validatePriceAndSell = (item: any) => {
  // Dans un cas réel complexe, une modale de confirmation du prix final s'ouvre.
  // Ici on valide directement le prix de base pour simuler la caisse.
  if (confirm(`Confirmer la vente de ${item.brand} au prix de ${item.publicPrice} CHF ?`)) {
     articleStore.changeStatus(item._id, 'sold');
  }
};
</script>
