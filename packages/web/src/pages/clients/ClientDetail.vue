<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Pencil, Phone, Mail, MapPin, CalendarDays, ShieldCheck, Download, Eye, FileText } from 'lucide-vue-next';
import type { IClient, IArticle, IRetrocessionSummary } from '@gm-boutique/shared';
import {
  getClient,
  getClientArticles,
  getClientRetrocessions,
} from '../../api/clients';
import { useNotificationsStore } from '../../stores/notifications';
import { formatCHF, formatDate } from '../../utils/format';
import DataTable, { type Column } from '../../components/ui/DataTable.vue';
import StatusBadge from '../../components/ui/StatusBadge.vue';
import ClientFormModal from '../../components/clients/ClientFormModal.vue';
import QrSignatureModal from '../../components/pos/QrSignatureModal.vue';
import ReceiptModal from '../../components/clients/ReceiptModal.vue';
import PdfPreviewModal from '../../components/ui/PdfPreviewModal.vue';
import { createReceipt, getClientReceipts, type IReceipt } from '../../api/receipts';
import { updateClient, generateClientProfilePDF } from '../../api/clients';
import { apiClient } from '../../api/client';
import {
  getClientDocuments,
  fetchDocumentBlob,
  documentTypeLabel,
  type IClientDocument,
} from '../../api/documents';

const route = useRoute();
const router = useRouter();
const notify = useNotificationsStore();

const client = ref<IClient | null>(null);
const articles = ref<IArticle[]>([]);
const retrocession = ref<IRetrocessionSummary | null>(null);
const receipts = ref<IReceipt[]>([]);
const documents = ref<IClientDocument[]>([]);
const loading = ref(true);
const isGeneratingPdf = ref(false);
const activeTab = ref<'articles' | 'retrocessions' | 'receipts' | 'documents'>('articles');
const formOpen = ref(false);

const selectedArticles = ref<string[]>([]);
const signatureModalOpen = ref(false);
const signatureType = ref<'first_deposit' | 'standard'>('standard');
const pendingReceiptType = ref<'deposit' | 'restitution' | null>(null);

const selectedReceipt = ref<IReceipt | null>(null);
const receiptModalOpen = ref(false);

// Aperçu PDF (fiche cliente)
const pdfPreviewOpen = ref(false);
const pdfBlobUrl = ref('');
const pdfFileName = ref('');

const clientId = computed(() => route.params.id as string);
const fullName = computed(() =>
  client.value ? `${client.value.firstName} ${client.value.lastName}` : ''
);

const canRestitute = computed(() => {
  if (selectedArticles.value.length === 0) return false;
  return selectedArticles.value.every(id => {
    const article = articles.value.find(a => a._id === id);
    return article && ['deposited', 'on_sale', 'expired'].includes(article.status);
  });
});

const articleColumns: Column[] = [
  { key: 'barcode', label: 'Code', width: '130px' },
  { key: 'brand', label: 'Marque', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'color', label: 'Couleur' },
  { key: 'size', label: 'Taille' },
  { key: 'description', label: 'Description' },
  { key: 'clientPrice', label: 'Gain (CHF)', align: 'right', sortable: true },
  { key: 'status', label: 'Statut', align: 'center' },
  { key: 'createdAt', label: 'Déposé le', width: '120px', sortable: true },
];

const documentColumns: Column[] = [
  { key: 'type', label: 'Type', sortable: true },
  { key: 'referenceNumber', label: 'Référence', width: '140px' },
  { key: 'createdAt', label: 'Généré le', width: '130px', sortable: true },
  { key: 'sentByEmail', label: 'Envoi', align: 'center', width: '140px' },
  { key: 'actions', label: '', align: 'right', width: '130px' },
];

async function load() {
  loading.value = true;
  try {
    const [c, a, r, rcpts, docs] = await Promise.all([
      getClient(clientId.value),
      getClientArticles(clientId.value).catch(() => [] as IArticle[]),
      getClientRetrocessions(clientId.value).catch(() => null),
      getClientReceipts(clientId.value).catch(() => [] as IReceipt[]),
      getClientDocuments(clientId.value).catch(() => [] as IClientDocument[])
    ]);
    client.value = c;
    articles.value = a;
    retrocession.value = r;
    receipts.value = rcpts;
    documents.value = docs;
  } catch {
    notify.error('Cliente introuvable.');
    router.push('/clients');
  } finally {
    loading.value = false;
  }
}

function onSaved(updated: IClient) {
  client.value = updated;
}

function openCguSignature() {
  signatureType.value = 'first_deposit';
  pendingReceiptType.value = null;
  signatureModalOpen.value = true;
}

function generateReceipt(type: 'deposit' | 'restitution') {
  if (selectedArticles.value.length === 0) {
    notify.error("Veuillez sélectionner au moins un article.");
    return;
  }
  signatureType.value = 'standard';
  pendingReceiptType.value = type;
  signatureModalOpen.value = true;
}

async function handleSignatureReceived(payload: { signatureBase64: string; cguAccepted: boolean }) {
  if (signatureType.value === 'first_deposit') {
    try {
      await updateClient(clientId.value, {
        cguAccepted: payload.cguAccepted,
        cguAcceptedAt: new Date().toISOString(),
        signatureData: payload.signatureBase64,
      } as any);
      notify.success('CGU acceptées avec succès.');
      load();
    } catch {
      notify.error("Erreur lors de l'enregistrement de la signature.");
    }
  } else if (pendingReceiptType.value) {
    try {
      await createReceipt({
        clientId: clientId.value,
        type: pendingReceiptType.value,
        articleIds: selectedArticles.value,
        signatureData: payload.signatureBase64
      });
      notify.success(pendingReceiptType.value === 'deposit' ? 'Bon de dépôt généré.' : 'Bon de restitution généré.');
      selectedArticles.value = [];
      load();
    } catch {
      notify.error("Erreur lors de la génération du bon.");
    }
  }
  signatureModalOpen.value = false;
}

async function openClientProfilePreview() {
  if (isGeneratingPdf.value) return;
  isGeneratingPdf.value = true;
  try {
    const doc = await generateClientProfilePDF(clientId.value);

    // Récupère le PDF en blob (auth via token) pour l'aperçu iframe.
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${apiClient.defaults.baseURL}/documents/${doc._id}/download`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Erreur de téléchargement");

    const blob = await response.blob();
    if (pdfBlobUrl.value) window.URL.revokeObjectURL(pdfBlobUrl.value);
    pdfBlobUrl.value = window.URL.createObjectURL(blob);
    pdfFileName.value = `Fiche_Cliente_${doc.referenceNumber}.pdf`;
    pdfPreviewOpen.value = true;
    // Rafraîchit la liste de l'onglet Documents pour y voir le nouveau PDF.
    documents.value = await getClientDocuments(clientId.value).catch(() => documents.value);
  } catch (error) {
    notify.error('Erreur lors de la génération du PDF.');
  } finally {
    isGeneratingPdf.value = false;
  }
}

function onPreviewClose() {
  pdfPreviewOpen.value = false;
  if (pdfBlobUrl.value) {
    window.URL.revokeObjectURL(pdfBlobUrl.value);
    pdfBlobUrl.value = '';
  }
}

// --- Onglet Documents ---
async function previewDocument(doc: IClientDocument) {
  try {
    const blob = await fetchDocumentBlob(doc._id);
    if (pdfBlobUrl.value) window.URL.revokeObjectURL(pdfBlobUrl.value);
    pdfBlobUrl.value = window.URL.createObjectURL(blob);
    pdfFileName.value = `${documentTypeLabel(doc.type)}_${doc.referenceNumber}.pdf`;
    pdfPreviewOpen.value = true;
  } catch {
    notify.error('Erreur lors de l’ouverture du document.');
  }
}

async function downloadDocument(doc: IClientDocument) {
  try {
    const blob = await fetchDocumentBlob(doc._id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTypeLabel(doc.type)}_${doc.referenceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    notify.error('Erreur lors du téléchargement du document.');
  }
}

watch(clientId, load);
onMounted(load);
onUnmounted(() => {
  if (pdfBlobUrl.value) window.URL.revokeObjectURL(pdfBlobUrl.value);
});
</script>

<template>
  <div class="w-full">
    <button
      class="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-5"
      @click="router.push('/clients')"
    >
      <ArrowLeft class="w-4 h-4" :stroke-width="1.75" />
      Retour aux clientes
    </button>

    <div v-if="loading" class="text-muted-foreground text-sm py-20 text-center">Chargement…</div>

    <template v-else-if="client">
      <!-- En-tête -->
      <div class="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
            {{ client.firstName.charAt(0) }}{{ client.lastName.charAt(0) }}
          </div>
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ fullName }}</h1>
            <span class="inline-flex items-center mt-1 px-2.5 py-1 rounded-md bg-black/5 font-mono text-[12px] font-semibold text-foreground">
              {{ client.referenceNumber }}
            </span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            class="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors"
            @click="openClientProfilePreview"
            :disabled="isGeneratingPdf"
          >
            <Download v-if="!isGeneratingPdf" class="w-4 h-4" :stroke-width="1.75" />
            <span v-else class="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></span>
            {{ isGeneratingPdf ? 'Génération...' : 'Fiche PDF' }}
          </button>
          <button
            v-if="!client.cguAccepted"
            class="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium border border-border bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            @click="openCguSignature"
          >
            Faire signer les CGU
          </button>
          <button
            class="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors"
            @click="formOpen = true"
          >
            <Pencil class="w-4 h-4" :stroke-width="1.75" />
            Modifier
          </button>
        </div>
      </div>

      <!-- Informations personnelles -->
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-6 mb-6">
        <h2 class="text-sm font-semibold text-foreground mb-4">Informations personnelles</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div class="flex items-center gap-3">
            <Phone class="w-4 h-4 text-muted-foreground shrink-0" :stroke-width="1.5" />
            <span class="text-[13px] text-foreground">{{ client.phone }}</span>
          </div>
          <div class="flex items-center gap-3">
            <Mail class="w-4 h-4 text-muted-foreground shrink-0" :stroke-width="1.5" />
            <span class="text-[13px]" :class="client.email ? 'text-foreground' : 'text-muted-foreground/60'">{{ client.email || 'Non renseigné' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <MapPin class="w-4 h-4 text-muted-foreground shrink-0" :stroke-width="1.5" />
            <span class="text-[13px]" :class="client.address ? 'text-foreground' : 'text-muted-foreground/60'">{{ client.address || 'Non renseignée' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <CalendarDays class="w-4 h-4 text-muted-foreground shrink-0" :stroke-width="1.5" />
            <span class="text-[13px] text-foreground">Inscrite le {{ formatDate(client.createdAt) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <ShieldCheck class="w-4 h-4 shrink-0" :class="client.cguAccepted ? 'text-emerald-600' : 'text-muted-foreground'" :stroke-width="1.5" />
            <span class="text-[13px] text-foreground">
              CGU {{ client.cguAccepted ? 'acceptées' : 'non acceptées' }}
              <span v-if="client.cguAccepted && client.cguAcceptedAt" class="text-muted-foreground"> ({{ formatDate(client.cguAcceptedAt) }})</span>
            </span>
          </div>
        </div>

        <!-- Affichage de la Signature enregistrée -->
        <div v-if="client.signatureData" class="mt-6 pt-4 border-t border-border/60 flex flex-col gap-2">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Signature Électronique</label>
          <div class="bg-gray-50 border border-border rounded-lg p-2 max-w-xs flex justify-center">
            <img :src="client.signatureData" alt="Signature cliente" class="h-20 object-contain" />
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="flex items-center gap-1 border-b border-border/60 mb-5">
        <button
          class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'articles' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'articles'"
        >
          Articles <span class="text-muted-foreground/60">({{ articles.length }})</span>
        </button>
        <button
          class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'retrocessions' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'retrocessions'"
        >
          Rétrocessions
        </button>
        <button
          class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'receipts' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'receipts'"
        >
          Bons & Reçus
        </button>
        <button
          class="px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'documents' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'documents'"
        >
          Documents <span class="text-muted-foreground/60">({{ documents.length }})</span>
        </button>
      </div>

      <!-- Onglet Articles -->
      <div v-if="activeTab === 'articles'">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm font-medium">
            <span v-if="selectedArticles.length > 0">{{ selectedArticles.length }} sélectionné(s)</span>
          </div>
          <div class="flex gap-2" v-if="selectedArticles.length > 0">
            <button class="h-9 px-3 bg-black text-white rounded-md text-xs font-medium hover:bg-gray-800" @click="generateReceipt('deposit')">
              Générer Bon de Dépôt
            </button>
            <button v-if="canRestitute" class="h-9 px-3 bg-white border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50" @click="generateReceipt('restitution')">
              Restituer Articles
            </button>
          </div>
        </div>
        <DataTable 
          :columns="articleColumns" 
          :rows="articles" 
          row-key="_id" 
          empty-text="Aucun article déposé."
          selectable
          v-model:selected="selectedArticles"
        >
          <template #cell-barcode="{ value }">
            <span class="font-mono text-[12px] text-foreground">{{ value }}</span>
          </template>
          <template #cell-brand="{ value }">
            <span class="font-medium text-foreground">{{ value }}</span>
          </template>
          <template #cell-clientPrice="{ value }">
            {{ formatCHF(value) }}
          </template>
          <template #cell-status="{ value }">
            <StatusBadge :status="value" />
          </template>
          <template #cell-createdAt="{ value }">
            <span class="text-muted-foreground">{{ formatDate(value) }}</span>
          </template>
        </DataTable>
      </div>
      <div v-else-if="activeTab === 'retrocessions'">
        <div v-if="retrocession" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
            <p class="text-[13px] text-muted-foreground">Articles vendus (non payés)</p>
            <p class="text-2xl font-semibold text-foreground mt-1">{{ retrocession.totalArticlesSold }}</p>
          </div>
          <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
            <p class="text-[13px] text-muted-foreground">Montant dû</p>
            <p class="text-2xl font-semibold text-foreground mt-1">{{ formatCHF(retrocession.totalAmountDue) }}</p>
          </div>
          <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
            <p class="text-[13px] text-muted-foreground">Statut</p>
            <span
              class="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium mt-2"
              :class="retrocession.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
            >
              {{ retrocession.status === 'paid' ? 'Payé' : 'En attente' }}
            </span>
          </div>
        </div>
        <div v-else class="text-muted-foreground text-sm py-10 text-center bg-card rounded-xl border border-border/60">
          Aucune donnée de rétrocession.
        </div>
      </div>
      <div v-else-if="activeTab === 'receipts'">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="receipt in receipts" 
            :key="receipt._id" 
            class="bg-card border border-border/60 rounded-xl p-4 shadow-sm cursor-pointer hover:border-foreground/30 hover:shadow-md transition-all"
            @click="selectedReceipt = receipt; receiptModalOpen = true"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-mono text-sm font-semibold">{{ receipt.referenceNumber }}</span>
              <span class="text-xs font-medium px-2 py-1 rounded-full" :class="receipt.type === 'deposit' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'">
                {{ receipt.type === 'deposit' ? 'Dépôt' : 'Restitution' }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground mb-3">{{ formatDate(receipt.createdAt) }}</p>
            <div class="text-sm mb-3">
              <span class="font-medium">{{ receipt.articleIds.length }}</span> article(s)
            </div>
            <div class="mt-2 pt-2 border-t border-border/60">
              <img :src="receipt.signatureData" class="h-10 object-contain mix-blend-multiply" />
            </div>
          </div>
          <div v-if="!receipts.length" class="col-span-full text-center py-10 text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
            Aucun bon généré.
          </div>
        </div>
      </div>

      <!-- Onglet Documents -->
      <div v-else-if="activeTab === 'documents'">
        <div class="flex items-center justify-end mb-4">
          <button
            class="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors disabled:opacity-60"
            @click="openClientProfilePreview"
            :disabled="isGeneratingPdf"
          >
            <FileText class="w-4 h-4" :stroke-width="1.75" />
            {{ isGeneratingPdf ? 'Génération…' : 'Générer la fiche de dépôt' }}
          </button>
        </div>

        <DataTable
          :columns="documentColumns"
          :rows="documents"
          row-key="_id"
          empty-text="Aucun document généré."
        >
          <template #cell-type="{ row }">
            <span class="inline-flex items-center gap-2 font-medium text-foreground">
              <FileText class="w-4 h-4 text-muted-foreground shrink-0" :stroke-width="1.75" />
              {{ documentTypeLabel(row.type) }}
            </span>
          </template>
          <template #cell-referenceNumber="{ value }">
            <span class="font-mono text-[12px] text-foreground">{{ value }}</span>
          </template>
          <template #cell-createdAt="{ value }">
            <span class="text-muted-foreground">{{ formatDate(value) }}</span>
          </template>
          <template #cell-sentByEmail="{ row }">
            <span
              v-if="row.sentByEmail"
              class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700"
              :title="row.sentAt ? `Envoyé le ${formatDate(row.sentAt)}` : 'Envoyé'"
            >
              <Mail class="w-3.5 h-3.5" :stroke-width="2" /> Envoyé
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium bg-black/5 text-muted-foreground"
            >
              <Mail class="w-3.5 h-3.5" :stroke-width="2" /> Non envoyé
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex items-center justify-end gap-1">
              <button
                class="p-1.5 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
                title="Aperçu"
                aria-label="Aperçu"
                @click="previewDocument(row)"
              >
                <Eye class="w-4 h-4" :stroke-width="1.75" />
              </button>
              <button
                class="p-1.5 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
                title="Télécharger"
                aria-label="Télécharger"
                @click="downloadDocument(row)"
              >
                <Download class="w-4 h-4" :stroke-width="1.75" />
              </button>
              <button
                class="p-1.5 rounded-md text-muted-foreground/40 cursor-not-allowed"
                title="Envoi par email — disponible après l'endpoint email (#22)"
                aria-label="Envoyer par email"
                disabled
              >
                <Mail class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <ClientFormModal v-model:open="formOpen" :client="client" @saved="onSaved" />

      <QrSignatureModal
        :is-open="signatureModalOpen"
        :signature-type="signatureType"
        @close="signatureModalOpen = false"
        @signed="handleSignatureReceived"
      />

      <ReceiptModal
        v-model:open="receiptModalOpen"
        :receipt="selectedReceipt"
        :client="client"
      />

      <PdfPreviewModal
        :open="pdfPreviewOpen"
        :blob-url="pdfBlobUrl"
        :file-name="pdfFileName"
        title="Fiche cliente"
        @update:open="(v: boolean) => { if (!v) onPreviewClose(); }"
      />
    </template>
  </div>
</template>
