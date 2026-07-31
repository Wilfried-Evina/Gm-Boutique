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
  // Séparateur de milliers par un point.
  return `${value.toLocaleString('de-DE')} CHF`;
}

// Données de démonstration (à brancher sur l'API ultérieurement).
const stats = [
  { id: 'on-sale', label: 'Articles en vente', value: '128' },
  { id: 'sales', label: 'Ventes du mois', value: formatCHF(14320) },
  { id: 'due', label: 'Rétrocessions dues', value: formatCHF(6540) },
  { id: 'clients', label: 'Clientes actives', value: '47' },
];

const expiring = [
  { barcode: 'GM-A-1042', brand: 'Zara', type: 'Manteau', client: 'Marie Dubois', deadline: '02.08.2026' },
  { barcode: 'GM-A-0987', brand: 'Sézane', type: 'Robe', client: 'Claire Roux', deadline: '04.08.2026' },
  { barcode: 'GM-A-1120', brand: 'COS', type: 'Pull', client: 'Léa Martin', deadline: '05.08.2026' },
  { barcode: 'GM-A-1135', brand: 'Chanel', type: 'Sac', client: 'Julie Dupont', deadline: '06.08.2026' },
  { barcode: 'GM-A-1140', brand: 'Dior', type: 'Lunettes', client: 'Sophie Leblanc', deadline: '07.08.2026' },
  { barcode: 'GM-A-1152', brand: 'Maje', type: 'Jupe', client: 'Alice Morel', deadline: '08.08.2026' },
  { barcode: 'GM-A-1168', brand: 'Sandro', type: 'Veste', client: 'Caroline Leroy', deadline: '09.08.2026' },
  { barcode: 'GM-A-1175', brand: 'Ba&sh', type: 'Chemise', client: 'Elodie Blanc', deadline: '10.08.2026' },
  { barcode: 'GM-A-1182', brand: 'Hermès', type: 'Foulard', client: 'Martine Roux', deadline: '11.08.2026' },
  { barcode: 'GM-A-1190', brand: 'Gucci', type: 'Ceinture', client: 'Lucie Bernard', deadline: '12.08.2026' },
];

const recentSales = [
  { barcode: 'GM-A-0912', brand: 'Maje', price: 89, client: 'Sophie Blanc', date: '28.07.2026' },
  { barcode: 'GM-A-0876', brand: 'Sandro', price: 120, client: 'Anne Favre', date: '27.07.2026' },
  { barcode: 'GM-A-0844', brand: 'Ba&sh', price: 65, client: 'Nadia Perret', date: '27.07.2026' },
  { barcode: 'GM-A-0810', brand: 'Chanel', price: 1500, client: 'Juliette Moreau', date: '26.07.2026' },
  { barcode: 'GM-A-0785', brand: 'Dior', price: 350, client: 'Camille Leroy', date: '26.07.2026' },
  { barcode: 'GM-A-0762', brand: 'Saint Laurent', price: 890, client: 'Manon Bernard', date: '25.07.2026' },
  { barcode: 'GM-A-0740', brand: 'Zadig & Voltaire', price: 110, client: 'Chloe Simon', date: '25.07.2026' },
  { barcode: 'GM-A-0715', brand: 'Celine', price: 420, client: 'Sarah Michel', date: '24.07.2026' },
  { barcode: 'GM-A-0690', brand: 'Prada', price: 560, client: 'Emma Robert', date: '24.07.2026' },
  { barcode: 'GM-A-0655', brand: 'Balenciaga', price: 380, client: 'Lea Dubois', date: '23.07.2026' },
];
</script>

<template>
  <div class="w-full h-full pb-12">
    <!-- En-tête -->
    <div class="mb-12 flex flex-col items-center justify-center text-center">
      <h1 class="text-[36px] font-extrabold tracking-tight text-gray-900 leading-tight">
        Tableau de bord
      </h1>
      <p class="text-[16px] text-gray-500 mt-2 font-medium tracking-wide">
        Voici un aperçu de l'activité de votre boutique.
      </p>
    </div>

    <!-- Cartes d'indicateurs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <div
        v-for="s in stats"
        :key="s.id"
        class="flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
      >
        <p class="text-[14px] font-medium text-gray-500">{{ s.label }}</p>
        <p class="text-[36px] font-semibold tracking-tight text-gray-900 mt-3 leading-none">{{ s.value }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Ventes récentes -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[16px] font-semibold text-gray-900">Ventes récentes</h2>
          <button class="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Tout voir</button>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div class="flex flex-col divide-y divide-gray-50">
            <div v-for="v in recentSales.slice(0, 8)" :key="v.barcode" class="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group cursor-pointer">
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Banknote class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" :stroke-width="1.5" />
                </div>
                <div class="min-w-0">
                  <p class="text-[14px] font-medium text-gray-900 truncate">
                    {{ v.brand }}
                  </p>
                  <p class="text-[13px] text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                    {{ v.client }} <span class="w-1 h-1 rounded-full bg-gray-300"></span> {{ v.barcode }}
                  </p>
                </div>
              </div>
              <div class="text-right shrink-0 ml-4">
                <p class="text-[14px] font-semibold text-gray-900">CHF {{ v.price }}</p>
                <p class="text-[12px] text-gray-400 mt-0.5">{{ v.date }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Articles à échéance proche -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[16px] font-semibold text-gray-900">Échéances proches</h2>
          <button class="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors">Gérer</button>
        </div>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
          <div class="flex flex-col divide-y divide-gray-50">
            <div v-for="a in expiring.slice(0, 8)" :key="a.barcode" class="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors group cursor-pointer">
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Clock class="w-4 h-4 text-orange-500" :stroke-width="1.5" />
                </div>
                <div class="min-w-0">
                  <p class="text-[14px] font-medium text-gray-900 truncate">
                    {{ a.brand }} · {{ a.type }}
                  </p>
                  <p class="text-[13px] text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                    {{ a.client }} <span class="w-1 h-1 rounded-full bg-gray-300"></span> {{ a.barcode }}
                  </p>
                </div>
              </div>
              <div class="text-right shrink-0 ml-4">
                <span class="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 border border-orange-100/50 text-[11px] font-semibold text-orange-700">
                  {{ a.deadline }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
