<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import VueApexCharts from 'vue3-apexcharts';
import { TrendingUp, Banknote, Package, Clock, ArrowUpRight, AlertTriangle } from 'lucide-vue-next';
import type { IArticle } from '@gm-boutique/shared';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { formatCHF, formatDate } from '../utils/format';
import {
  getDashboardStats,
  getDashboardCA,
  type DashboardStats,
  type CAResponse,
  type DashboardPeriod,
} from '../api/dashboard';
import { articlesApi } from '../api/articles';

const router = useRouter();
const authStore = useAuthStore();
const notify = useNotificationsStore();

const prenom = computed(() => authStore.user?.firstName ?? 'Gérante');

const periods: { key: DashboardPeriod; label: string }[] = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year', label: 'Année' },
];
const period = ref<DashboardPeriod>('month');

const stats = ref<DashboardStats | null>(null);
const ca = ref<CAResponse | null>(null);
const recent = ref<IArticle[]>([]);
const expired = ref<IArticle[]>([]);
const loadingCA = ref(false);

function clientLabel(a: IArticle): string {
  const c: any = a.clientId;
  return c && typeof c === 'object' ? `${c.firstName} ${c.lastName}` : '';
}

async function loadCA() {
  loadingCA.value = true;
  try {
    ca.value = await getDashboardCA(period.value);
  } catch {
    notify.error('Impossible de charger le chiffre d’affaires.');
  } finally {
    loadingCA.value = false;
  }
}

async function loadAll() {
  try {
    const [s, recentRes, exp] = await Promise.all([
      getDashboardStats().catch(() => null),
      articlesApi.getAll({ limit: 6 }).catch(() => ({ data: [] as IArticle[] } as any)),
      articlesApi.getExpired().catch(() => [] as IArticle[]),
    ]);
    stats.value = s;
    recent.value = recentRes.data ?? [];
    expired.value = exp;
  } catch {
    notify.error('Erreur lors du chargement du tableau de bord.');
  }
  await loadCA();
}

watch(period, loadCA);
onMounted(loadAll);

const chartSeries = computed(() => {
  const s = ca.value?.series ?? [];
  return [
    { name: 'CA', data: s.map((p) => p.ca) },
    { name: 'Gains', data: s.map((p) => p.gains) },
    { name: 'Rétrocessions', data: s.map((p) => p.retro) },
  ];
});

const chartOptions = computed(() => ({
  chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', animations: { easing: 'easeinout', speed: 400 } },
  colors: ['#0a0a0a', '#059669', '#d97706'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.15, opacityTo: 0.02 } },
  grid: { borderColor: '#e4e4e7', strokeDashArray: 4 },
  legend: { position: 'top', horizontalAlign: 'right', markers: { radius: 12 } },
  xaxis: {
    categories: ca.value?.series.map((p) => p.label) ?? [],
    labels: { style: { colors: '#71717a', fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: '#71717a', fontSize: '11px' }, formatter: (v: number) => `${Math.round(v)}` } },
  tooltip: { y: { formatter: (v: number) => formatCHF(v) } },
}));
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- En-tête + filtre période -->
    <div class="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Bonjour {{ prenom }} 👋</h1>
        <p class="text-sm text-muted-foreground mt-1">Aperçu de l'activité de la boutique.</p>
      </div>
      <div class="inline-flex items-center bg-black/5 rounded-lg p-0.5">
        <button
          v-for="p in periods"
          :key="p.key"
          class="h-8 px-3 rounded-md text-[13px] font-medium transition-colors"
          :class="period === p.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="period = p.key"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Cartes KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center">
            <TrendingUp class="w-[18px] h-[18px] text-foreground/70" :stroke-width="1.75" />
          </div>
        </div>
        <p class="text-2xl font-semibold tracking-tight text-foreground">{{ formatCHF(ca?.totals.totalCA ?? 0) }}</p>
        <p class="text-[13px] text-muted-foreground mt-0.5">Chiffre d'affaires</p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <div class="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
          <ArrowUpRight class="w-[18px] h-[18px] text-emerald-700" :stroke-width="1.75" />
        </div>
        <p class="text-2xl font-semibold tracking-tight text-emerald-700">{{ formatCHF(ca?.totals.storeEarnings ?? 0) }}</p>
        <p class="text-[13px] text-muted-foreground mt-0.5">Gains commerce</p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
          <Banknote class="w-[18px] h-[18px] text-amber-700" :stroke-width="1.75" />
        </div>
        <p class="text-2xl font-semibold tracking-tight text-foreground">{{ formatCHF(stats?.pendingRetroAmount ?? 0) }}</p>
        <p class="text-[13px] text-muted-foreground mt-0.5">Rétrocessions en attente ({{ stats?.pendingRetroCount ?? 0 }})</p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5 cursor-pointer hover:border-foreground/20 transition-colors" @click="router.push('/articles/en-vente')">
        <div class="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center mb-3">
          <Package class="w-[18px] h-[18px] text-foreground/70" :stroke-width="1.75" />
        </div>
        <p class="text-2xl font-semibold tracking-tight text-foreground">{{ stats?.articles.onSale ?? 0 }}</p>
        <p class="text-[13px] text-muted-foreground mt-0.5">Articles en vente · taux {{ stats?.sellRate ?? 0 }}%</p>
      </div>
    </div>

    <!-- Graphique -->
    <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5 mb-6">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm font-semibold text-foreground">CA · Gains · Rétrocessions</h2>
        <span v-if="loadingCA" class="text-[12px] text-muted-foreground">Chargement…</span>
      </div>
      <VueApexCharts type="area" height="300" :options="chartOptions" :series="chartSeries" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Derniers articles déposés -->
      <section class="bg-card rounded-xl border border-border/60 shadow-sm p-6">
        <h2 class="text-sm font-semibold text-foreground mb-4">Derniers articles déposés</h2>
        <div v-if="recent.length" class="flex flex-col divide-y divide-border/50">
          <div
            v-for="a in recent"
            :key="a._id"
            class="flex items-center justify-between py-3 cursor-pointer hover:bg-black/[0.02] -mx-2 px-2 rounded-md transition-colors"
            @click="router.push('/articles')"
          >
            <div class="min-w-0">
              <p class="text-[13px] font-medium text-foreground truncate">{{ a.brand }} · {{ a.type }}</p>
              <p class="text-[12px] text-muted-foreground truncate">{{ clientLabel(a) }} — {{ a.barcode }}</p>
            </div>
            <span class="text-[12px] text-muted-foreground shrink-0 ml-3">{{ formatDate(a.createdAt) }}</span>
          </div>
        </div>
        <p v-else class="text-[13px] text-muted-foreground py-6 text-center">Aucun article déposé.</p>
      </section>

      <!-- Alertes -->
      <section class="bg-card rounded-xl border border-border/60 shadow-sm p-6">
        <h2 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-amber-600" :stroke-width="1.75" /> Alertes
        </h2>

        <div class="flex items-center justify-between py-2.5 border-b border-border/50">
          <span class="text-[13px] text-foreground">Rétrocessions en attente</span>
          <span class="text-[12px] font-medium px-2 py-0.5 rounded-full" :class="(stats?.pendingRetroCount ?? 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">
            {{ stats?.pendingRetroCount ?? 0 }}
          </span>
        </div>

        <div class="mt-3">
          <div class="flex items-center gap-2 mb-2 text-[13px] text-foreground">
            <Clock class="w-4 h-4 text-amber-600" :stroke-width="1.75" />
            Articles à date butoir passée
            <span class="text-[12px] font-medium px-2 py-0.5 rounded-full ml-auto" :class="expired.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">
              {{ expired.length }}
            </span>
          </div>
          <div v-if="expired.length" class="flex flex-col divide-y divide-border/50">
            <div
              v-for="a in expired.slice(0, 5)"
              :key="a._id"
              class="flex items-center justify-between py-2 cursor-pointer hover:bg-black/[0.02] -mx-2 px-2 rounded-md transition-colors"
              @click="router.push('/articles/expires')"
            >
              <span class="text-[12px] text-foreground truncate">{{ a.brand }} · {{ a.type }}</span>
              <span class="text-[11px] text-muted-foreground shrink-0 ml-3">{{ a.barcode }}</span>
            </div>
          </div>
          <p v-else class="text-[12px] text-muted-foreground py-2">Aucun article en dépassement.</p>
        </div>
      </section>
    </div>
  </div>
</template>
