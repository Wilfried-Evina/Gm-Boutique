<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Pencil, Phone, Mail, MapPin, CalendarDays, ShieldCheck } from 'lucide-vue-next';
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

const route = useRoute();
const router = useRouter();
const notify = useNotificationsStore();

const client = ref<IClient | null>(null);
const articles = ref<IArticle[]>([]);
const retrocession = ref<IRetrocessionSummary | null>(null);
const loading = ref(true);
const activeTab = ref<'articles' | 'retrocessions'>('articles');
const formOpen = ref(false);

const clientId = computed(() => route.params.id as string);
const fullName = computed(() =>
  client.value ? `${client.value.firstName} ${client.value.lastName}` : ''
);

const articleColumns: Column[] = [
  { key: 'barcode', label: 'Code', width: '130px' },
  { key: 'brand', label: 'Marque', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'publicPrice', label: 'Prix public', align: 'right', sortable: true },
  { key: 'status', label: 'Statut', align: 'center' },
  { key: 'createdAt', label: 'Déposé le', width: '120px', sortable: true },
];

async function load() {
  loading.value = true;
  try {
    const [c, a, r] = await Promise.all([
      getClient(clientId.value),
      getClientArticles(clientId.value).catch(() => [] as IArticle[]),
      getClientRetrocessions(clientId.value).catch(() => null),
    ]);
    client.value = c;
    articles.value = a;
    retrocession.value = r;
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

watch(clientId, load);
onMounted(load);
</script>

<template>
  <div class="max-w-5xl mx-auto">
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
        <button
          class="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors"
          @click="formOpen = true"
        >
          <Pencil class="w-4 h-4" :stroke-width="1.75" />
          Modifier
        </button>
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
      </div>

      <!-- Onglet Articles -->
      <div v-if="activeTab === 'articles'">
        <DataTable :columns="articleColumns" :rows="articles" row-key="_id" empty-text="Aucun article déposé.">
          <template #cell-barcode="{ value }">
            <span class="font-mono text-[12px] text-foreground">{{ value }}</span>
          </template>
          <template #cell-brand="{ value }">
            <span class="font-medium text-foreground">{{ value }}</span>
          </template>
          <template #cell-publicPrice="{ value }">
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

      <!-- Onglet Rétrocessions -->
      <div v-else>
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

      <ClientFormModal v-model:open="formOpen" :client="client" @saved="onSaved" />
    </template>
  </div>
</template>
