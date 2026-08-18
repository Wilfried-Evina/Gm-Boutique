<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Tous les articles</h1>
        <p class="mt-2 text-sm text-gray-700">Gérez l'ensemble du stock, tous statuts confondus.</p>
      </div>
      <div class="mt-4 sm:mt-0 space-x-3 flex">
        <button
          @click="openBarcodeScanner"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 sm:w-auto"
        >
          <svg class="w-5 h-5 mr-2 -ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
          </svg>
          Scanner Code-barres
        </button>
        <button
          @click="isFormModalOpen = true"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 sm:w-auto"
        >
          + Nouveau Dépôt
        </button>
        <button
          v-if="selectedArticlesIds.length > 0"
          @click="handlePrintSelected"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 sm:w-auto"
        >
          <svg class="w-5 h-5 mr-2 -ml-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          Imprimer ({{ selectedArticlesIds.length }})
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
      <div class="flex-1 max-w-xs">
        <label class="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Filtrer par statut</label>
        <select 
          v-model="statusFilter" 
          @change="applyFilters"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-9 px-3 border bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="deposited">En dépôt</option>
          <option value="on_sale">En vente</option>
          <option value="sold">Vendu</option>
          <option value="returned">Restitué</option>
        </select>
      </div>

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
      <template #head-select>
        <input type="checkbox" :checked="isAllSelected" @change="toggleAll" class="rounded border-gray-300 text-black focus:ring-black" />
      </template>

      <template #cell-select="{ row: item }">
        <input type="checkbox" :value="item._id" v-model="selectedArticlesIds" class="rounded border-gray-300 text-black focus:ring-black" @click.stop />
      </template>
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
        {{ item.clientId.firstName }} {{ item.clientId.lastName }}
      </template>

      <template #cell-price="{ row: item }">
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-gray-900">{{ item.publicPrice.toFixed(2) }} CHF <span class="font-normal text-xs text-gray-500">(Boutique)</span></span>
          <span class="text-xs text-gray-500">{{ item.clientPrice.toFixed(2) }} CHF (Gain Cliente)</span>
        </div>
      </template>

      <template #cell-status="{ row: item }">
        <StatusBadge :status="item.status" />
      </template>
      
      <template #cell-actions="{ row: item }">
        <div class="flex justify-end space-x-2">
          <!-- Action: Modifier -->
          <button v-if="['deposited', 'on_sale'].includes(item.status)" @click="openEditModal(item)" class="text-xs font-medium text-gray-600 hover:text-black">Modifier</button>
          
          <!-- Action: Mettre en vente (si déposé) -->
          <button v-if="item.status === 'deposited'" @click="articleStore.changeStatus(item._id, 'on_sale')" class="text-xs font-medium text-blue-600 hover:text-blue-900">En Vente</button>
          
          <!-- Action: Restituer (si en dépôt ou en vente) -->
          <button v-if="['deposited', 'on_sale'].includes(item.status)" @click="openRestitution(item)" class="text-xs font-medium text-orange-600 hover:text-orange-900" title="Restituer l'article">Restituer</button>
        </div>
      </template>
    </DataTable>

    <!-- Modals -->
    <ArticleFormModal 
      :is-open="isFormModalOpen" 
      :article-to-edit="articleToEdit"
      @close="isFormModalOpen = false; articleToEdit = null" 
      @saved="onArticleSaved" 
    />
    
    <BarcodePreviewModal 
      :is-open="isBarcodeModalOpen" 
      :barcode="selectedBarcode" 
      :article="selectedArticle"
      @close="isBarcodeModalOpen = false" 
    />

    <QrSignatureModal
      :isOpen="isRestitutionQrModalOpen"
      signatureType="standard"
      @close="isRestitutionQrModalOpen = false"
      @signed="handleRestitutionSignature"
    />

    <!-- Scanner Modal -->
    <Modal :open="isScannerModalOpen" title="Scanner un Code-barres" @update:open="isScannerModalOpen = false">
      <form @submit.prevent="submitScanner" class="space-y-4 p-2">
        <p class="text-sm text-gray-500 text-center">
          Veuillez scanner ou taper le code-barres (ex: GM-YYYY-XXXX).
        </p>
        <div>
          <input 
            type="text" 
            v-model="scannedCode"
            ref="scannerInput"
            placeholder="GM-..." 
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border" 
            required 
            autofocus
          />
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="isScannerModalOpen = false"
            class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="bg-black border border-transparent text-white hover:bg-gray-800 px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
          >
            Rechercher
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useArticleStore } from '../../stores/articles';
import { listClients } from '../../api/clients';
import DataTable from '../../components/ui/DataTable.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import Modal from '../../components/ui/Modal.vue';
import ArticleFormModal from '../../components/articles/ArticleFormModal.vue';
import BarcodePreviewModal from '../../components/articles/BarcodePreviewModal.vue';
import QrSignatureModal from '../../components/pos/QrSignatureModal.vue';
import { printArticlesLabels } from '../../utils/printLabels';
import { createReceipt } from '../../api/receipts';
import { useNotificationsStore } from '../../stores/notifications';

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();
const statusFilter = ref('');
const clientFilter = ref('');
const clients = ref<any[]>([]);

const isFormModalOpen = ref(false);
const articleToEdit = ref<any>(null);
const isBarcodeModalOpen = ref(false);
const selectedBarcode = ref<string | null>(null);
const selectedArticle = ref<any>(null);

const isScannerModalOpen = ref(false);
const scannedCode = ref('');
const scannerInput = ref<HTMLInputElement | null>(null);

const selectedArticlesIds = ref<string[]>([]);

const columns = [
  { key: 'select', label: '', width: '40px', sortable: false },
  { key: 'barcode', label: 'Réf / Code-barres' },
  { key: 'brand', label: 'Marque' },
  { key: 'type', label: 'Type' },
  { key: 'color', label: 'Couleur' },
  { key: 'size', label: 'Taille' },
  { key: 'description', label: 'Description' },
  { key: 'clientId', label: 'Déposante' },
  { key: 'price', label: 'Prix' },
  { key: 'status', label: 'Statut' },
  { key: 'actions', label: '', align: 'right' as const }
];

const loadFiltersFromRoute = () => {
  if (route.query.status) {
    statusFilter.value = route.query.status as string;
  } else {
    statusFilter.value = '';
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
  articleToEdit.value = null;
};

const openEditModal = (item: any) => {
  articleToEdit.value = item;
  isFormModalOpen.value = true;
};

const openBarcode = (item: any) => {
  if (typeof item === 'string') {
    selectedBarcode.value = item;
    selectedArticle.value = null;
  } else {
    selectedBarcode.value = item.barcode;
    selectedArticle.value = item;
  }
  isBarcodeModalOpen.value = true;
};

const openBarcodeScanner = async () => {
  scannedCode.value = '';
  isScannerModalOpen.value = true;
  // Attendre que la modale s'ouvre pour focus l'input
  setTimeout(() => {
    scannerInput.value?.focus();
  }, 100);
};

const submitScanner = () => {
  if (scannedCode.value) {
    const code = scannedCode.value.trim().toUpperCase();
    const article = articleStore.articles.find(a => a.barcode === code);
    
    if (article) {
      openBarcode(article);
    } else {
      openBarcode(code); // Fallback string
    }
    isScannerModalOpen.value = false;
  }
};

const isAllSelected = computed(() => {
  if (articleStore.articles.length === 0) return false;
  return selectedArticlesIds.value.length === articleStore.articles.length;
});

const toggleAll = (e: any) => {
  if (e.target.checked) {
    selectedArticlesIds.value = articleStore.articles.map((a: any) => a._id);
  } else {
    selectedArticlesIds.value = [];
  }
};

const handlePrintSelected = () => {
  const selected = articleStore.articles.filter((a: any) => selectedArticlesIds.value.includes(a._id));
  printArticlesLabels(selected);
};
const isRestitutionQrModalOpen = ref(false);
const articleToRestitute = ref<any>(null);
const notify = useNotificationsStore();

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
