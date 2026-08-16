<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Pencil } from 'lucide-vue-next';
import type { IClient } from '@gm-boutique/shared';
import { listClients, updateClient } from '../../api/clients';
import { useNotificationsStore } from '../../stores/notifications';
import { formatDate } from '../../utils/format';
import SearchBar from '../../components/ui/SearchBar.vue';
import DataTable, { type Column } from '../../components/ui/DataTable.vue';
import Pagination from '../../components/ui/Pagination.vue';
import ClientFormModal from '../../components/clients/ClientFormModal.vue';
import QrSignatureModal from '../../components/pos/QrSignatureModal.vue';

type ClientRow = IClient & { articleCount?: number };

const router = useRouter();
const notify = useNotificationsStore();

const rows = ref<ClientRow[]>([]);
const loading = ref(false);
const search = ref('');
const page = ref(1);
const limit = 10;
const total = ref(0);
const totalPages = ref(1);

const formOpen = ref(false);
const editing = ref<IClient | null>(null);

// Signature QR Code
const signatureModalOpen = ref(false);
const newlyCreatedClient = ref<IClient | null>(null);

const columns: Column[] = [
  { key: 'referenceNumber', label: 'Réf', sortable: true, width: '130px' },
  { key: 'lastName', label: 'Nom', sortable: true },
  { key: 'firstName', label: 'Prénom', sortable: true },
  { key: 'phone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
  { key: 'articleCount', label: 'Articles', sortable: true, align: 'center', width: '90px' },
  { key: 'createdAt', label: 'Inscription', sortable: true, width: '120px' },
  { key: 'actions', label: '', align: 'right', width: '60px' },
];

async function load() {
  loading.value = true;
  try {
    const res = await listClients({ page: page.value, limit, search: search.value || undefined });
    rows.value = res.data;
    total.value = res.total;
    totalPages.value = res.totalPages;
  } catch {
    notify.error('Impossible de charger les clientes.');
    rows.value = [];
    total.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
}

watch(search, () => {
  page.value = 1;
  load();
});
watch(page, load);

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(client: IClient) {
  editing.value = client;
  formOpen.value = true;
}

function onSaved(client: IClient) {
  load();
  // Si c'est une nouvelle cliente (pas un edit), on ouvre la modale de signature avec CGU
  if (!editing.value) {
    newlyCreatedClient.value = client;
    signatureModalOpen.value = true;
  }
}

async function handleSignatureReceived(payload: { signatureBase64: string; cguAccepted: boolean }) {
  if (!newlyCreatedClient.value?._id) return;
  try {
    await updateClient(newlyCreatedClient.value._id, {
      cguAccepted: payload.cguAccepted,
      cguAcceptedAt: new Date().toISOString(),
      signatureData: payload.signatureBase64,
    } as any);
    notify.success('Signature et CGU enregistrées avec succès.');
    load();
  } catch {
    notify.error("Erreur lors de l'enregistrement de la signature.");
  } finally {
    signatureModalOpen.value = false;
    newlyCreatedClient.value = null;
  }
}

function goToClient(client: IClient) {
  router.push(`/clients/${client._id}`);
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
        <p class="text-sm text-muted-foreground mt-1">Gestion des déposantes de la boutique.</p>
      </div>
      <button
        class="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        @click="openCreate"
      >
        <Plus class="w-4 h-4" :stroke-width="2" />
        Nouvelle cliente
      </button>
    </div>

    <div class="mb-4">
      <SearchBar v-model="search" placeholder="Rechercher par nom, prénom, téléphone ou référence…" />
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      clickable-rows
      empty-text="Aucune cliente trouvée."
      @row-click="goToClient"
    >
      <template #cell-referenceNumber="{ value }">
        <span class="font-mono text-[12px] font-medium text-foreground">{{ value }}</span>
      </template>
      <template #cell-lastName="{ value }">
        <span class="font-medium text-foreground">{{ value }}</span>
      </template>
      <template #cell-email="{ value }">
        <span class="text-muted-foreground">{{ value || '—' }}</span>
      </template>
      <template #cell-articleCount="{ value }">
        <span>{{ value ?? '—' }}</span>
      </template>
      <template #cell-createdAt="{ value }">
        <span class="text-muted-foreground">{{ formatDate(value) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button
          class="p-1.5 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
          aria-label="Modifier"
          @click.stop="openEdit(row)"
        >
          <Pencil class="w-4 h-4" :stroke-width="1.75" />
        </button>
      </template>
    </DataTable>

    <div class="mt-4">
      <Pagination v-model:page="page" :total-pages="totalPages" :total="total" />
    </div>

    <ClientFormModal v-model:open="formOpen" :client="editing" @saved="onSaved" />

    <!-- Modale QR signature (s'ouvre automatiquement après création d'une nouvelle cliente) -->
    <QrSignatureModal
      :is-open="signatureModalOpen"
      signature-type="first_deposit"
      @close="signatureModalOpen = false; newlyCreatedClient = null;"
      @signed="handleSignatureReceived"
    />
  </div>
</template>
