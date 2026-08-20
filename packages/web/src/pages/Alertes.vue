<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, PhoneCall, TrendingDown, Clock, ArrowRight } from 'lucide-vue-next';
import type { IArticle } from '@gm-boutique/shared';
import { articlesApi } from '../api/articles';
import { useNotificationsStore } from '../stores/notifications';
import { formatCHF, formatDate } from '../utils/format';

const router = useRouter();
const notify = useNotificationsStore();

const alerts = ref<IArticle[]>([]);
const loading = ref(true);

function clientOf(a: IArticle): any {
  return a.clientId && typeof a.clientId === 'object' ? a.clientId : null;
}
function clientName(a: IArticle): string {
  const c = clientOf(a);
  return c ? `${c.firstName} ${c.lastName}` : 'Déposante inconnue';
}
function deadlineOf(a: IArticle): Date | null {
  const d = a.priceReduction?.deadlineDate;
  return d ? new Date(d) : null;
}
function daysLeft(a: IArticle): number {
  const d = deadlineOf(a);
  if (!d) return 0;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}
/** Durée en boutique depuis le dépôt, formatée. */
function inShopSince(a: IArticle): string {
  const created = new Date(a.createdAt).getTime();
  const days = Math.floor((Date.now() - created) / 86_400_000);
  if (days < 1) return "aujourd'hui";
  if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `${months} mois`;
}
function deadlineLabel(a: IArticle): string {
  const n = daysLeft(a);
  if (n < 0) return `dépassée depuis ${-n} jour${-n > 1 ? 's' : ''}`;
  if (n === 0) return "aujourd'hui";
  return `dans ${n} jour${n > 1 ? 's' : ''}`;
}
function isOverdue(a: IArticle): boolean {
  return daysLeft(a) < 0;
}

const recuperations = computed(() =>
  alerts.value.filter((a) => a.priceReduction?.actionOnExpiry === 'return_to_client')
);
const baisses = computed(() =>
  alerts.value.filter((a) => a.priceReduction?.actionOnExpiry === 'reduce_price')
);

async function load() {
  loading.value = true;
  try {
    alerts.value = await articlesApi.getAlerts();
  } catch {
    notify.error('Impossible de charger les alertes.');
    alerts.value = [];
  } finally {
    loading.value = false;
  }
}

function goToClient(a: IArticle) {
  const c = clientOf(a);
  if (c?._id) router.push(`/clients/${c._id}`);
}

onMounted(load);
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
        <Bell class="w-5 h-5" :stroke-width="1.75" /> Alertes
      </h1>
      <p class="text-sm text-muted-foreground mt-1">
        Articles arrivant à échéance — anticiper les contacts et les baisses de prix.
      </p>
    </div>

    <!-- Résumé -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <p class="text-[13px] text-muted-foreground">Alertes actives</p>
        <p class="text-2xl font-semibold text-foreground mt-1">{{ alerts.length }}</p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <p class="text-[13px] text-muted-foreground">Récupérations à prévoir</p>
        <p class="text-2xl font-semibold text-amber-700 mt-1">{{ recuperations.length }}</p>
      </div>
      <div class="bg-card rounded-xl border border-border/60 shadow-sm p-5">
        <p class="text-[13px] text-muted-foreground">Baisses de prix à venir</p>
        <p class="text-2xl font-semibold text-blue-700 mt-1">{{ baisses.length }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-muted-foreground text-sm py-16 text-center">Chargement…</div>

    <template v-else>
      <!-- Section : Récupérations -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <PhoneCall class="w-4 h-4 text-amber-600" :stroke-width="1.75" />
          Récupérations à prévoir <span class="text-muted-foreground/60 font-normal">({{ recuperations.length }})</span>
        </h2>
        <div v-if="recuperations.length" class="flex flex-col gap-3">
          <div
            v-for="a in recuperations"
            :key="a._id"
            class="bg-card rounded-xl border border-border/60 shadow-sm p-4 border-l-4"
            :class="isOverdue(a) ? 'border-l-red-500' : 'border-l-amber-400'"
          >
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="min-w-0">
                <p class="text-[14px] text-foreground">
                  L'article <strong>{{ a.brand }} · {{ a.type }}</strong> de la déposante
                  <strong>{{ clientName(a) }}</strong> est en boutique depuis {{ inShopSince(a) }}.
                  Elle doit venir le récupérer — <span :class="isOverdue(a) ? 'text-red-600 font-medium' : 'text-amber-700 font-medium'">échéance {{ deadlineLabel(a) }}</span>.
                </p>
                <div class="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                  <span class="inline-flex items-center gap-1"><Clock class="w-3.5 h-3.5" :stroke-width="1.75" /> {{ formatDate(deadlineOf(a)) }}</span>
                  <span class="font-mono">{{ a.barcode }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <a
                  v-if="clientOf(a)?.phone"
                  :href="`tel:${clientOf(a).phone}`"
                  class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <PhoneCall class="w-4 h-4" :stroke-width="1.75" /> {{ clientOf(a).phone }}
                </a>
                <button
                  class="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors"
                  @click="goToClient(a)"
                >
                  Fiche <ArrowRight class="w-4 h-4" :stroke-width="1.75" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-[13px] text-muted-foreground py-6 text-center bg-card rounded-xl border border-dashed border-border/60">
          Aucune récupération à prévoir.
        </p>
      </section>

      <!-- Section : Baisses de prix -->
      <section>
        <h2 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingDown class="w-4 h-4 text-blue-600" :stroke-width="1.75" />
          Baisses de prix à venir <span class="text-muted-foreground/60 font-normal">({{ baisses.length }})</span>
        </h2>
        <div v-if="baisses.length" class="flex flex-col gap-3">
          <div
            v-for="a in baisses"
            :key="a._id"
            class="bg-card rounded-xl border border-border/60 shadow-sm p-4 border-l-4"
            :class="isOverdue(a) ? 'border-l-red-500' : 'border-l-blue-400'"
          >
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="min-w-0">
                <p class="text-[14px] text-foreground">
                  Le prix de l'article <strong>{{ a.brand }} · {{ a.type }}</strong> de la déposante
                  <strong>{{ clientName(a) }}</strong> sera baissé
                  <span :class="isOverdue(a) ? 'text-red-600 font-medium' : 'text-blue-700 font-medium'">{{ deadlineLabel(a) }}</span>
                  (durée limite en boutique atteinte).
                </p>
                <div class="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                  <span class="inline-flex items-center gap-1"><Clock class="w-3.5 h-3.5" :stroke-width="1.75" /> {{ formatDate(deadlineOf(a)) }}</span>
                  <span v-if="a.priceReduction?.reducedPublicPrice">
                    {{ formatCHF(a.publicPrice) }} → <strong class="text-foreground">{{ formatCHF(a.priceReduction.reducedPublicPrice) }}</strong>
                  </span>
                  <span class="font-mono">{{ a.barcode }}</span>
                </div>
              </div>
              <button
                class="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors shrink-0"
                @click="goToClient(a)"
              >
                Fiche <ArrowRight class="w-4 h-4" :stroke-width="1.75" />
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-[13px] text-muted-foreground py-6 text-center bg-card rounded-xl border border-dashed border-border/60">
          Aucune baisse de prix à venir.
        </p>
      </section>
    </template>
  </div>
</template>
