<template>
  <div class="h-full flex flex-col p-6 max-w-full mx-auto w-full">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-gray-900">Factures & Bordereaux</h1>
        <p class="text-sm text-gray-500 mt-1">Historique complet des ventes et encaissements</p>
      </div>
      
      <div class="flex items-center gap-4">
        <button @click="openHistoricalGodMode" class="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Digitaliser une ancienne facture
        </button>
      </div>
    </div>

    <!-- Report Generator Card -->
    <div v-if="!isLoading && sales.length > 0" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
      <div class="flex items-center gap-6">
        <!-- Icon + Label -->
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <div class="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <span class="text-sm font-bold text-gray-900">Rapport</span>
        </div>

        <!-- Separator -->
        <div class="w-px h-8 bg-gray-200"></div>

        <!-- Mode Tabs -->
        <div class="flex bg-gray-100 rounded-lg p-0.5">
          <button @click="reportMode = 'month'" :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-all', reportMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            Mois
          </button>
          <button @click="reportMode = 'period'" :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-all', reportMode === 'period' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            Période
          </button>
          <button @click="reportMode = 'year'" :class="['px-3 py-1.5 text-xs font-bold rounded-md transition-all', reportMode === 'year' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            Année
          </button>
        </div>

        <!-- Separator -->
        <div class="w-px h-8 bg-gray-200"></div>

        <!-- Mode: Mois -->
        <div v-if="reportMode === 'month'" class="flex items-center gap-2">
          <select v-model="selectedMonth" class="gm-select">
            <option v-for="m in availableMonthsForYear(selectedMonthYear)" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model="selectedMonthYear" class="gm-select gm-select-year">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Mode: Période -->
        <div v-if="reportMode === 'period'" class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider mx-1">Du</span>
          <select v-model="pStartDay" class="gm-select gm-select-day">
            <option v-for="d in availablePStartDays" :key="d" :value="d">{{ d }}</option>
          </select>
          <select v-model="pStartMonth" class="gm-select">
            <option v-for="m in availableMonthsForYear(pStartYear)" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model="pStartYear" class="gm-select gm-select-year">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>

          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider mx-1 ml-2">Au</span>
          <select v-model="pEndDay" class="gm-select gm-select-day">
            <option v-for="d in availablePEndDays" :key="d" :value="d">{{ d }}</option>
          </select>
          <select v-model="pEndMonth" class="gm-select">
            <option v-for="m in availableMonthsForYear(pEndYear)" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model="pEndYear" class="gm-select gm-select-year">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Mode: Année -->
        <div v-if="reportMode === 'year'" class="flex items-center gap-2">
          <select v-model="selectedYear" class="gm-select gm-select-year">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <!-- Generate Button -->
        <button @click="generateReport" :disabled="isGeneratingReport || !canGenerate" class="ml-auto flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <svg v-if="!isGeneratingReport" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <svg v-else class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Télécharger le rapport PDF
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
      <div class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/50">
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Référence</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Date</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Articles</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase">Paiement</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase text-right">Gain GM</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase text-right">Gain Dép.</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase text-right">Total</th>
              <th class="py-4 px-6 text-xs font-bold tracking-wider text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="isLoading" class="animate-pulse">
              <td colspan="8" class="py-12 text-center text-gray-400">Chargement de l'historique...</td>
            </tr>
            <tr v-else-if="sales.length === 0">
              <td colspan="8" class="py-12 text-center text-gray-400">Aucune vente enregistrée pour le moment.</td>
            </tr>
            <tr v-else v-for="sale in sales" :key="sale._id" class="hover:bg-gray-50/50 transition-colors group">
              <td class="py-4 px-6">
                <span class="font-bold font-mono text-gray-900">{{ sale.reference }}</span>
              </td>
              <td class="py-4 px-6 text-sm text-gray-600">
                {{ formatDate(sale.createdAt) }}
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {{ sale.articles.length }} article(s)
                </span>
              </td>
              <td class="py-4 px-6">
                <span class="text-sm text-gray-600 capitalize">{{ formatPaymentMethod(sale.paymentMethod) }}</span>
              </td>
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-gray-900">{{ calculateGains(sale).boutiqueGain.toFixed(2) }} CHF</span>
              </td>
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-gray-900">{{ calculateGains(sale).clientGain.toFixed(2) }} CHF</span>
              </td>
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-gray-900">{{ sale.totalAmount.toFixed(2) }} CHF</span>
              </td>
              <td class="py-4 px-6 text-right">
                <button @click="openReceipt(sale)" class="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end w-full gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  Voir le reçu
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Receipt Modal -->
    <ReceiptPreviewModal 
      :is-open="isReceiptOpen"
      :sale="selectedSale"
      @close="closeReceipt"
    />

    <!-- Historical God Mode Modal -->
    <HistoricalGodModeModal 
      :is-open="isGodModeOpen"
      @close="isGodModeOpen = false"
      @saved="handleHistoricalSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { salesApi } from '../api/sales';
import { apiClient } from '../api/client';
import type { ISale } from '@gm-boutique/shared';
import ReceiptPreviewModal from '../components/pos/ReceiptPreviewModal.vue';
import HistoricalGodModeModal from '../components/pos/HistoricalGodModeModal.vue';
import { useNotificationsStore } from '../stores/notifications';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const sales = ref<ISale[]>([]);
const isLoading = ref(true);
const notifications = useNotificationsStore();

const calculateGains = (sale: any) => {
  let boutiqueGain = 0;
  let clientGain = 0;
  
  if (sale.articles && Array.isArray(sale.articles)) {
    sale.articles.forEach((article: any) => {
      const salePrice = article.finalSalePrice || article.publicPrice || 0;
      const cGain = article.finalClientAmount || article.clientPrice || 0;
      boutiqueGain += (salePrice - cGain);
      clientGain += cGain;
    });
  }
  
  return { boutiqueGain, clientGain };
};

const isReceiptOpen = ref(false);
const selectedSale = ref<ISale | null>(null);
const isGodModeOpen = ref(false);
const isGeneratingReport = ref(false);

// Report mode
const reportMode = ref<'month' | 'period' | 'year'>('month');

// Mode: Month
const now = new Date();
const selectedMonth = ref(now.getMonth());
const selectedMonthYear = ref(now.getFullYear());

// Mode: Period
const pStartDay = ref(now.getDate());
const pStartMonth = ref(now.getMonth());
const pStartYear = ref(now.getFullYear());
const pEndDay = ref(now.getDate());
const pEndMonth = ref(now.getMonth());
const pEndYear = ref(now.getFullYear());

// Mode: Year
const selectedYear = ref(now.getFullYear());

// Computed oldest date
const oldestSaleDate = computed(() => {
  if (sales.value.length === 0) return new Date();
  const dates = sales.value.map(s => new Date(s.createdAt).getTime());
  return new Date(Math.min(...dates));
});

// Helpers pour les jours
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getAvailableDays = (year: number, month: number) => {
  const daysInMonth = getDaysInMonth(year, month);
  const minYear = oldestSaleDate.value.getFullYear();
  const minMonth = oldestSaleDate.value.getMonth();
  const minDay = oldestSaleDate.value.getDate();
  
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  const days: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    if (year === minYear && month === minMonth && d < minDay) continue;
    if (year === currentYear && month === currentMonth && d > currentDay) continue;
    days.push(d);
  }
  return days;
};

const availablePStartDays = computed(() => getAvailableDays(pStartYear.value, pStartMonth.value));
const availablePEndDays = computed(() => getAvailableDays(pEndYear.value, pEndMonth.value));

const availableYears = computed(() => {
  const minYear = oldestSaleDate.value.getFullYear();
  const maxYear = now.getFullYear();
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  return years;
});

const availableMonthsForYear = (year: number) => {
  const minYear = oldestSaleDate.value.getFullYear();
  const minMonth = oldestSaleDate.value.getMonth();
  const months: { value: number; label: string }[] = [];
  for (let m = 0; m < 12; m++) {
    if (year === minYear && m < minMonth) continue;
    if (year === now.getFullYear() && m > now.getMonth()) continue;
    months.push({ value: m, label: MONTH_NAMES[m] });
  }
  return months;
};

// Clamp month when year changes
watch(selectedMonthYear, (y) => {
  const valid = availableMonthsForYear(y);
  if (valid.length > 0 && !valid.find(m => m.value === selectedMonth.value)) {
    selectedMonth.value = valid[0].value;
  }
});

// Clamp period start
watch(pStartYear, (y) => {
  const valid = availableMonthsForYear(y);
  if (valid.length > 0 && !valid.find(m => m.value === pStartMonth.value)) {
    pStartMonth.value = valid[0].value;
  }
});
watch([pStartYear, pStartMonth], () => {
  const valid = availablePStartDays.value;
  if (valid.length > 0 && !valid.includes(pStartDay.value)) {
    pStartDay.value = valid[valid.length - 1]; // fallback to last valid day
  }
});

// Clamp period end
watch(pEndYear, (y) => {
  const valid = availableMonthsForYear(y);
  if (valid.length > 0 && !valid.find(m => m.value === pEndMonth.value)) {
    pEndMonth.value = valid[valid.length - 1].value;
  }
});
watch([pEndYear, pEndMonth], () => {
  const valid = availablePEndDays.value;
  if (valid.length > 0 && !valid.includes(pEndDay.value)) {
    pEndDay.value = valid[valid.length - 1]; // fallback to last valid day
  }
});

// Can generate?
const canGenerate = computed(() => {
  return true; // Les selects contrôlés garantissent qu'on a toujours une date valide !
});

// Build date range from mode
const getDateRange = (): { start: Date; end: Date; label: string } => {
  if (reportMode.value === 'month') {
    const start = new Date(selectedMonthYear.value, selectedMonth.value, 1);
    const end = new Date(selectedMonthYear.value, selectedMonth.value + 1, 0, 23, 59, 59);
    return { start, end, label: `${MONTH_NAMES[selectedMonth.value]}_${selectedMonthYear.value}` };
  }
  if (reportMode.value === 'year') {
    const start = new Date(selectedYear.value, 0, 1);
    const end = new Date(selectedYear.value, 11, 31, 23, 59, 59);
    return { start, end, label: `Annee_${selectedYear.value}` };
  }
  // period
  const start = new Date(pStartYear.value, pStartMonth.value, pStartDay.value, 0, 0, 0);
  const end = new Date(pEndYear.value, pEndMonth.value, pEndDay.value, 23, 59, 59);
  const startStr = `${pStartDay.value.toString().padStart(2, '0')}.${(pStartMonth.value + 1).toString().padStart(2, '0')}.${pStartYear.value}`;
  const endStr = `${pEndDay.value.toString().padStart(2, '0')}.${(pEndMonth.value + 1).toString().padStart(2, '0')}.${pEndYear.value}`;
  return { start, end, label: `${startStr}_au_${endStr}` };
};

const generateReport = async () => {
  const { start, end, label } = getDateRange();
  
  if (start > end) {
    notifications.error('La date de début doit être avant la date de fin.');
    return;
  }
  
  isGeneratingReport.value = true;
  try {
    const doc = await salesApi.generateSalesReport(start, end);
    
    const response = await apiClient.get(`/documents/${doc._id}/download`, {
      responseType: 'blob'
    });
    
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_Ventes_${label}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    notifications.success('Rapport PDF généré avec succès !');
  } catch (err: any) {
    console.error("Erreur PDF:", err);
    const apiError = err.response?.data;
    let errorMsg = "Erreur lors de la génération du rapport.";
    if (apiError?.details) {
      errorMsg = `Erreur API: ${apiError.message} - ${apiError.details}`;
    } else if (apiError?.message) {
      errorMsg = apiError.message;
    } else if (err.message) {
      errorMsg = `Erreur Client: ${err.message}`;
    }
    notifications.error(errorMsg);
  } finally {
    isGeneratingReport.value = false;
  }
};

const openHistoricalGodMode = () => {
  isGodModeOpen.value = true;
};

const handleHistoricalSaved = (sale: ISale) => {
  fetchSales();
};

const fetchSales = async () => {
  isLoading.value = true;
  try {
    sales.value = await salesApi.getAll();
  } catch (err) {
    notifications.error('Erreur lors du chargement des factures');
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('fr-CH', {
    dateStyle: 'short',
  }).format(new Date(date));
};

const formatPaymentMethod = (method: string) => {
  const methods: Record<string, string> = {
    card: 'Carte Bancaire',
    cash: 'Espèces',
    twint: 'TWINT'
  };
  return methods[method] || method;
};

const openReceipt = (sale: ISale) => {
  selectedSale.value = sale;
  isReceiptOpen.value = true;
};

const closeReceipt = () => {
  isReceiptOpen.value = false;
  setTimeout(() => {
    selectedSale.value = null;
  }, 200);
};

onMounted(() => {
  fetchSales();
});
</script>

<style scoped>
.gm-select {
  appearance: none;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.4rem 1.75rem 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  transition: all 0.15s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.375rem center;
  background-size: 1rem;
}
.gm-select:hover {
  border-color: #9ca3af;
  background-color: #fff;
}
.gm-select:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.08);
  background-color: #fff;
}
.gm-select-year {
  width: 5.5rem;
}
.gm-select-day {
  width: 4rem;
}
.gm-input {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
  transition: all 0.15s ease;
}
.gm-input:hover {
  border-color: #9ca3af;
  background-color: #fff;
}
.gm-input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.08);
  background-color: #fff;
}
</style>
