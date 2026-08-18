<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight, CreditCard } from 'lucide-vue-next';
import { useNotificationsStore } from '../stores/notifications';
import { formatCHF } from '../utils/format';
import DataTable, { type Column } from '../components/ui/DataTable.vue';
import PdfPreviewModal from '../components/ui/PdfPreviewModal.vue';
import RetrocessionPaymentModal from '../components/retrocessions/RetrocessionPaymentModal.vue';
import {
  getAllRetrocessions,
  getRetrocessionStats,
  getRetrocessionForClient,
  type RetrocessionRow,
  type RetrocessionPayResponse,
} from '../api/retrocessions';
import { fetchDocumentBlob } from '../api/documents';
import type { IRetrocessionGlobalStats, IRetrocessionItem } from '@gm-boutique/shared';

const router = useRouter();
const notify = useNotificationsStore();

const rows = ref<RetrocessionRow[]>([]);
const stats = ref<IRetrocessionGlobalStats | null>(null);
const loading = ref(false);

// Modale de règlement
const paymentModalOpen = ref(false);
const selectedClient = ref<{ _id: string; firstName: string; lastName: string; referenceNumber?: string; phone?: string; address?: string } | null>(null);
const articlesToPay = ref<IRetrocessionItem[]>([]);

// Aperçu PDF quittance
const pdfModalOpen = ref(false);
const pdfBlobUrl = ref<string>('');

const columns: Column[] = [
  { key: 'clientName', label: 'Déposante', sortable: true },
  { key: 'totalArticlesSold', label: 'Articles vendus', align: 'center', sortable: true, width: '130px' },
  { key: 'totalRetrocessions', label: 'Total gains déposante', align: 'right', sortable: true },
  { key: 'totalPaid', label: 'Déjà versé', align: 'right', sortable: true },
  { key: 'remainingToPay', label: 'Reste à verser', align: 'right', sortable: true },
  { key: 'status', label: 'Statut', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'right', width: '180px' },
];

async function load() {
  loading.value = true;
  try {
    const [r, s] = await Promise.all([
      getAllRetrocessions(),
      getRetrocessionStats().catch(() => null),
    ]);
    rows.value = r;
    stats.value = s;
  } catch {
    notify.error('Impossible de charger les rétrocessions.');
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

async function openPaymentModal(row: RetrocessionRow) {
  try {
    const summary = await getRetrocessionForClient(row.clientId);
    const unpaidItems = summary.items.filter((it) => !it.retrocessionPaid);

    if (unpaidItems.length === 0) {
      notify.info('Aucun montant restant à régler pour cette déposante.');
      return;
    }

    const nameParts = row.clientName.split(' ');
    selectedClient.value = {
      _id: row.clientId,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      referenceNumber: row.referenceNumber,
    };
    articlesToPay.value = unpaidItems;
    paymentModalOpen.value = true;
  } catch (error) {
    notify.error('Erreur lors du chargement des articles à régler.');
  }
}

async function handlePaymentSuccess(res: RetrocessionPayResponse) {
  load();
  if (res.documentId) {
    try {
      const blob = await fetchDocumentBlob(res.documentId);
      if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value);
      pdfBlobUrl.value = URL.createObjectURL(blob);
      pdfModalOpen.value = true;
    } catch (e) {
      console.error(e);
      notify.error('Erreur lors de l’ouverture de la quittance.');
    }
  }
}

function onPdfClose(v: boolean) {
  pdfModalOpen.value = v;
  if (!v && pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value);
    pdfBlobUrl.value = '';
  }
}

onMounted(load);
</script>

<template>
  <div class="w-full">
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">Rétrocessions</h1>
      <p class="text-sm text-muted-foreground mt-1">Suivi et règlement des gains dus aux déposantes.</p>
    </div>

    <!-- 4 Indicateurs globaux clairs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- 1. Total gains déposantes -->
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5 flex flex-col items-center text-center justify-center">
        <p class="text-[13px] text-muted-foreground">Total gains déposantes</p>
        <p class="text-2xl font-semibold text-foreground mt-1">
          {{ formatCHF(stats?.totalGlobalRetrocessions ?? 0) }}
        </p>
      </div>

      <!-- 2. Déjà versé -->
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5 flex flex-col items-center text-center justify-center">
        <p class="text-[13px] text-muted-foreground">Déjà versé aux déposantes</p>
        <p class="text-2xl font-semibold text-emerald-700 mt-1">
          {{ formatCHF(stats?.totalGlobalPaid ?? 0) }}
        </p>
      </div>

      <!-- 3. Reste à verser -->
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5 flex flex-col items-center text-center justify-center">
        <p class="text-[13px] text-muted-foreground">Reste à verser (en attente)</p>
        <p class="text-2xl font-semibold mt-1" :class="(stats?.totalGlobalRemaining ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'">
          {{ formatCHF(stats?.totalGlobalRemaining ?? 0) }}
        </p>
      </div>

      <!-- 4. Déposantes à régler -->
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5 flex flex-col items-center text-center justify-center">
        <p class="text-[13px] text-muted-foreground">Déposantes à régler</p>
        <p class="text-2xl font-semibold text-foreground mt-1">
          {{ stats?.clientsWithPendingCount ?? 0 }}
        </p>
      </div>
    </div>

    <!-- Tableau -->
    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      row-key="clientId"
      clickable-rows
      empty-text="Aucune rétrocession pour le moment."
      @row-click="(r) => router.push(`/clients/${r.clientId}`)"
    >
      <template #cell-clientName="{ row }">
        <span class="font-medium text-foreground">{{ row.clientName }}</span>
        <span class="block font-mono text-[11px] text-muted-foreground">{{ row.referenceNumber }}</span>
      </template>

      <template #cell-totalRetrocessions="{ value }">{{ formatCHF(value) }}</template>

      <template #cell-totalPaid="{ value }">
        <span class="text-muted-foreground">{{ formatCHF(value) }}</span>
      </template>

      <template #cell-remainingToPay="{ value }">
        <span class="font-bold" :class="value > 0 ? 'text-amber-700' : 'text-emerald-700'">{{ formatCHF(value) }}</span>
      </template>

      <template #cell-status="{ row }">
        <span
          class="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
          :class="row.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
        >
          {{ row.status === 'paid' ? 'Soldé' : 'En attente' }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-2" @click.stop>
          <button
            v-if="row.remainingToPay > 0"
            class="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            @click="openPaymentModal(row)"
          >
            <CreditCard class="w-3.5 h-3.5" />
            <span>Régler</span>
          </button>

          <button
            class="p-1.5 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
            title="Voir la fiche"
            @click="router.push(`/clients/${row.clientId}`)"
          >
            <ChevronRight class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Modale de règlement sécurisée -->
    <RetrocessionPaymentModal
      v-model:open="paymentModalOpen"
      :client="selectedClient"
      :articles="articlesToPay"
      @success="handlePaymentSuccess"
    />

    <!-- Aperçu quittance PDF -->
    <PdfPreviewModal
      :open="pdfModalOpen"
      :blob-url="pdfBlobUrl"
      file-name="Quittance_Retrocession.pdf"
      title="Quittance de règlement de rétrocession"
      @update:open="onPdfClose"
    />
  </div>
</template>

