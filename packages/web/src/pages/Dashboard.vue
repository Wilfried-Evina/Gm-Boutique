<script setup lang="ts">
import { computed } from 'vue';
import {
  Package,
  Banknote,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const prenom = computed(() => authStore.user?.firstName ?? 'Gérante');

function formatCHF(value: number): string {
  // Format suisse : séparateur de milliers par apostrophe.
  return `CHF ${value.toLocaleString('de-CH').replace(/’/g, "'")}`;
}

// Données de démonstration (à brancher sur l'API ultérieurement).
const stats = [
  { id: 'on-sale', label: 'Articles en vente', value: '128', delta: '+12', icon: Package },
  { id: 'sales', label: 'Ventes du mois', value: formatCHF(14320), delta: '+8%', icon: TrendingUp },
  { id: 'due', label: 'Rétrocessions dues', value: formatCHF(6540), delta: '9 clientes', icon: Banknote },
  { id: 'clients', label: 'Clientes actives', value: '47', delta: '+3', icon: Users },
];

const expiring = [
  { barcode: 'GM-A-1042', brand: 'Zara', type: 'Manteau', client: 'Marie Dubois', deadline: '02.08.2026' },
  { barcode: 'GM-A-0987', brand: 'Sézane', type: 'Robe', client: 'Claire Roux', deadline: '04.08.2026' },
  { barcode: 'GM-A-1120', brand: 'COS', type: 'Pull', client: 'Léa Martin', deadline: '05.08.2026' },
];

const recentSales = [
  { barcode: 'GM-A-0912', brand: 'Maje', price: 89, client: 'Sophie Blanc', date: '28.07.2026' },
  { barcode: 'GM-A-0876', brand: 'Sandro', price: 120, client: 'Anne Favre', date: '27.07.2026' },
  { barcode: 'GM-A-0844', brand: 'Ba&sh', price: 65, client: 'Nadia Perret', date: '27.07.2026' },
];
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight text-foreground">
        Bonjour {{ prenom }} 👋
      </h1>
      <p class="text-sm text-muted-foreground mt-1">
        Voici un aperçu de l'activité de la boutique.
      </p>
    </div>

    <!-- Cartes d'indicateurs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="s in stats"
        :key="s.id"
        class="bg-card rounded-xl border border-border/60 shadow-sm p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center">
            <component :is="s.icon" class="w-[18px] h-[18px] text-foreground/70" :stroke-width="1.5" />
          </div>
          <span class="text-[11px] font-medium text-muted-foreground">{{ s.delta }}</span>
        </div>
        <p class="text-2xl font-semibold tracking-tight text-foreground">{{ s.value }}</p>
        <p class="text-[13px] text-muted-foreground mt-0.5">{{ s.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Articles à échéance proche -->
      <section class="bg-card rounded-xl border border-border/60 shadow-sm p-6">
        <div class="flex items-center gap-2 mb-5">
          <Clock class="w-4 h-4 text-muted-foreground" :stroke-width="1.5" />
          <h2 class="text-sm font-semibold text-foreground">Échéances proches</h2>
        </div>
        <div class="flex flex-col divide-y divide-border/50">
          <div v-for="a in expiring" :key="a.barcode" class="flex items-center justify-between py-3">
            <div class="min-w-0">
              <p class="text-[13px] font-medium text-foreground truncate">
                {{ a.brand }} · {{ a.type }}
              </p>
              <p class="text-[12px] text-muted-foreground truncate">
                {{ a.client }} — {{ a.barcode }}
              </p>
            </div>
            <span class="text-[12px] font-medium text-foreground/70 shrink-0 ml-3">{{ a.deadline }}</span>
          </div>
        </div>
      </section>

      <!-- Ventes récentes -->
      <section class="bg-card rounded-xl border border-border/60 shadow-sm p-6">
        <div class="flex items-center gap-2 mb-5">
          <ArrowUpRight class="w-4 h-4 text-muted-foreground" :stroke-width="1.5" />
          <h2 class="text-sm font-semibold text-foreground">Ventes récentes</h2>
        </div>
        <div class="flex flex-col divide-y divide-border/50">
          <div v-for="v in recentSales" :key="v.barcode" class="flex items-center justify-between py-3">
            <div class="min-w-0">
              <p class="text-[13px] font-medium text-foreground truncate">
                {{ v.brand }} — {{ v.client }}
              </p>
              <p class="text-[12px] text-muted-foreground truncate">{{ v.barcode }} · {{ v.date }}</p>
            </div>
            <span class="text-[13px] font-semibold text-foreground shrink-0 ml-3">CHF {{ v.price }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
