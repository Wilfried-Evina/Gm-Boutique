<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import { useNotificationsStore } from '../stores/notifications';
import { formatCHF } from '../utils/format';
import DataTable, { type Column } from '../components/ui/DataTable.vue';
import { getAllRetrocessions, markAllPaid, type RetrocessionRow } from '../api/retrocessions';

const router = useRouter();
const notify = useNotificationsStore();

const rows = ref<RetrocessionRow[]>([]);
const loading = ref(false);
const markingId = ref<string | null>(null);

const totalRemaining = computed(() => rows.value.reduce((s, r) => s + r.remainingToPay, 0));
const clientsToPay = computed(() => rows.value.filter((r) => r.remainingToPay > 0).length);
const totalRetro = computed(() => rows.value.reduce((s, r) => s + r.totalRetrocessions, 0));

const columns: Column[] = [
  { key: 'clientName', label: 'Cliente', sortable: true },
  { key: 'totalArticlesSold', label: 'Articles vendus', align: 'center', sortable: true, width: '130px' },
  { key: 'totalRetrocessions', label: 'Total rétrocessions', align: 'right', sortable: true },
  { key: 'remainingToPay', label: 'Restant à rembourser', align: 'right', sortable: true },
  { key: 'status', label: 'Statut', align: 'center', width: '130px' },
  { key: 'actions', label: '', align: 'right', width: '200px' },
];

async function load() {
  loading.value = true;
  try {
    rows.value = await getAllRetrocessions();
  } catch {
    notify.error('Impossible de charger les rétrocessions.');
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

async function markAll(row: RetrocessionRow) {
  if (markingId.value) return;
  markingId.value = row.clientId;
  try {
    await markAllPaid(row.clientId);
    notify.success(`Rétrocessions de ${row.clientName} marquées comme remboursées.`);
    await load();
  } catch {
    notify.error('Erreur lors du marquage des remboursements.');
  } finally {
    markingId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">Rétrocessions</h1>
      <p class="text-sm text-muted-foreground mt-1">Suivi des montants à reverser aux déposantes.</p>
    </div>

    <!-- Indicateurs globaux -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <p class="text-[13px] text-muted-foreground">Restant à rembourser (total)</p>
        <p class="text-2xl font-semibold mt-1" :class="totalRemaining > 0 ? 'text-amber-700' : 'text-emerald-700'">
          {{ formatCHF(totalRemaining) }}
        </p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <p class="text-[13px] text-muted-foreground">Clientes à rembourser</p>
        <p class="text-2xl font-semibold text-foreground mt-1">{{ clientsToPay }}</p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <p class="text-[13px] text-muted-foreground">Total rétrocessions</p>
        <p class="text-2xl font-semibold text-foreground mt-1">{{ formatCHF(totalRetro) }}</p>
      </div>
    </div>

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
      <template #cell-remainingToPay="{ value }">
        <span class="font-medium" :class="value > 0 ? 'text-amber-700' : 'text-foreground'">{{ formatCHF(value) }}</span>
      </template>
      <template #cell-status="{ row }">
        <span
          class="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
          :class="row.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
        >
          {{ row.status === 'paid' ? 'Remboursé' : 'En attente' }}
        </span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-2" @click.stop>
          <button
            v-if="row.remainingToPay > 0"
            class="h-8 px-2.5 border border-border rounded-md text-[12px] font-medium hover:bg-black/[0.03] disabled:opacity-50 transition-colors"
            :disabled="markingId === row.clientId"
            @click="markAll(row)"
          >
            {{ markingId === row.clientId ? '…' : 'Tout marquer payé' }}
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
  </div>
</template>
