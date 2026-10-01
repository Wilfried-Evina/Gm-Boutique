<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Articles en vente</h1>
        <p class="mt-2 text-sm text-gray-700">Gérez le stock de vêtements actuellement en rayon.</p>
      </div>
      <!-- Les boutons d'action globaux ont été retirés -->
    </div>



    <!-- Table -->
    <DataTable
      :columns="columns"
      :rows="articleStore.articles"
      :loading="articleStore.isLoading"
      :total="articleStore.totalArticles"
      :page="articleStore.currentPage"
      :limit="articleStore.limit"
      @page-change="articleStore.fetchArticles"
    >
      <template #cell-barcode="{ row: item }">
        <div class="flex items-center font-mono text-sm">
          {{ item.barcode }}
          <button @click="openBarcode(item)" class="ml-2 text-gray-400 hover:text-black" title="Voir code-barres">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
            </svg>
          </button>
        </div>
      </template>

      <template #cell-clientId="{ row: item }">
        {{ (item.clientId as any).firstName }} {{ (item.clientId as any).lastName }}
      </template>

      <template #cell-price="{ row: item }">
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-gray-900">{{ item.publicPrice.toFixed(2) }} CHF <span class="font-normal text-xs text-gray-500">(Boutique)</span></span>
          <span class="text-xs text-gray-500">{{ item.clientPrice.toFixed(2) }} CHF (Gain Cliente)</span>
        </div>
      </template>

      <template #cell-actions="{ row: item }">
        <div class="flex justify-end space-x-2">
          <!-- Action: Restituer -->
          <button @click="openRestitution(item)" class="text-xs font-medium text-orange-600 hover:text-orange-900" title="Restituer l'article">Restituer</button>
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
      :article="selectedArticleForBarcode"
      @close="isBarcodeModalOpen = false" 
    />

    <QrSignatureModal
      :isOpen="isRestitutionQrModalOpen"
      signatureType="standard"
      @close="isRestitutionQrModalOpen = false"
      @signed="handleRestitutionSignature"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useArticleStore } from '../../stores/articles';
import { listClients } from '../../api/clients';
import { createReceipt } from '../../api/receipts';
import { useNotificationsStore } from '../../stores/notifications';
import DataTable from '../../components/ui/DataTable.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import ArticleFormModal from '../../components/articles/ArticleFormModal.vue';
import BarcodePreviewModal from '../../components/articles/BarcodePreviewModal.vue';
import QrSignatureModal from '../../components/pos/QrSignatureModal.vue';

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();
const notify = useNotificationsStore();
const statusFilter = ref('on_sale');
const clientFilter = ref('');
const clients = ref<any[]>([]);

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

const loadFiltersFromRoute = () => {
  if (route.query.client) {
    clientFilter.value = route.query.client as string;
  }
  applyFilters();
};

watch(() => route.query, () => {
  loadFiltersFromRoute();
}, { deep: true });

onMounted(async () => {
  loadFiltersFromRoute();
  
  try {
    const response = await listClients({ limit: 100 });
    clients.value = response.data;
  } catch (err) {
    console.error(err);
  }
});

const applyFilters = () => {
  articleStore.setFilters(
    statusFilter.value || undefined,
    clientFilter.value || undefined
  );
};

const onArticleSaved = () => {
  articleStore.fetchArticles(1);
};

const selectedArticleForBarcode = ref<any>(null);

const openBarcode = (item: any) => {
  selectedBarcode.value = item.barcode;
  selectedArticleForBarcode.value = item;
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

const isRestitutionQrModalOpen = ref(false);
const articleToRestitute = ref<any>(null);

const openRestitution = (item: any) => {
  articleToRestitute.value = item;
  isRestitutionQrModalOpen.value = true;
};

const handleRestitutionSignature = async (payload: { signatureBase64: string }) => {
  if (!articleToRestitute.value) return;
  
  try {
    const clientId = articleToRestitute.value.clientId._id || articleToRestitute.value.clientId;
    await createReceipt({
      clientId: clientId,
      type: 'restitution',
      articleIds: [articleToRestitute.value._id],
      signatureData: payload.signatureBase64
    });
    
    isRestitutionQrModalOpen.value = false;
    articleToRestitute.value = null;
    notify.success("Restitution effectuée. Le bon a été généré.");
    articleStore.fetchArticles(1);
  } catch (err) {
    console.error(err);
    notify.error("Erreur lors de la restitution.");
  }
};
</script>
