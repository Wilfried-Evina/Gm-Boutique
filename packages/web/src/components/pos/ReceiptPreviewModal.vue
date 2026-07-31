<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- HEADER -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-lg font-bold text-gray-900">Bordereau de Vente</h3>
        <button @click="close" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- CONTENT (Preview) -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-100/50 flex justify-center">
        <!-- Paper Sheet -->
        <div class="bg-white p-8 sm:p-12 shadow-sm border border-gray-200 rounded-lg w-full max-w-3xl font-sans" id="receipt-preview-content">
          
          <!-- Header -->
          <div class="flex justify-between items-start mb-10">
            <div>
              <h1 class="text-2xl font-black tracking-tighter text-gray-900 mb-1">GM BOUTIQUE</h1>
              <p class="text-sm text-gray-500">Bordereau Interne de Vente</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-mono text-gray-500 mb-1">Réf: <span class="font-bold text-gray-900">{{ sale?.reference }}</span></p>
              <p class="text-sm text-gray-500">{{ formattedDate }}</p>
            </div>
          </div>

          <!-- Table -->
          <table class="w-full text-left border-collapse mb-8">
            <thead>
              <tr class="border-b-2 border-gray-900">
                <th class="py-3 px-2 text-sm font-bold text-gray-900">Déposante</th>
                <th class="py-3 px-2 text-sm font-bold text-gray-900">Article</th>
                <th class="py-3 px-2 text-sm font-bold text-gray-900 text-right">Prix Vente</th>
                <th class="py-3 px-2 text-sm font-bold text-emerald-600 text-right">Gain Cliente</th>
                <th class="py-3 px-2 text-sm font-bold text-indigo-600 text-right">Gain GM</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in populatedArticles" :key="item._id" class="text-sm">
                <td class="py-3 px-2 font-medium text-gray-900">{{ item.clientName }}</td>
                <td class="py-3 px-2">
                  <div class="font-bold">{{ item.brand }}</div>
                  <div class="text-gray-500 text-xs">{{ item.type }} • {{ item.barcode }}</div>
                </td>
                <td class="py-3 px-2 text-right font-mono">{{ item.publicPrice.toFixed(2) }}</td>
                <td class="py-3 px-2 text-right font-mono text-emerald-600 font-medium">{{ item.clientPrice.toFixed(2) }}</td>
                <td class="py-3 px-2 text-right font-mono text-indigo-600 font-medium">{{ (item.publicPrice - item.clientPrice).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div class="flex justify-end">
            <div class="w-72 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">Total Encaissé</span>
                <span class="font-mono font-bold text-gray-900">{{ sale?.totalAmount.toFixed(2) }} CHF</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-emerald-600">Total Gains Clientes</span>
                <span class="font-mono font-bold text-emerald-600">{{ totalClientGain.toFixed(2) }} CHF</span>
              </div>
              <div class="border-t border-gray-200 my-2"></div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-bold text-indigo-600">Marge Nette GM</span>
                <span class="font-mono font-black text-indigo-600 text-lg">{{ totalBoutiqueGain.toFixed(2) }} CHF</span>
              </div>
            </div>
          </div>
          
          <div class="mt-12 text-center text-xs text-gray-400">
            Moyen de paiement : {{ paymentMethodLabel }}
          </div>
        </div>
      </div>

      <!-- FOOTER (Actions) -->
      <div class="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
        <button @click="close" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors">
          Fermer
        </button>
        <button @click="printReceipt" class="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all shadow-md hover:shadow-lg">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          Imprimer
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ISale } from '@gm-boutique/shared';

const props = defineProps<{
  isOpen: boolean;
  sale: ISale | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const close = () => {
  emit('close');
};

const formattedDate = computed(() => {
  if (!props.sale?.createdAt) return '';
  return new Intl.DateTimeFormat('fr-CH', { 
    dateStyle: 'long', 
    timeStyle: 'short' 
  }).format(new Date(props.sale.createdAt));
});

const paymentMethodLabel = computed(() => {
  if (!props.sale) return '';
  const methods = {
    card: 'Carte Bancaire',
    cash: 'Espèces',
    twint: 'TWINT'
  };
  return methods[props.sale.paymentMethod as keyof typeof methods] || props.sale.paymentMethod;
});

// Calculate populated articles safely
const populatedArticles = computed(() => {
  if (!props.sale || !props.sale.articles) return [];
  
  // The articles are populated from the backend. 
  // We type cast them for the template.
  return props.sale.articles.map((item: any) => {
    return {
      _id: item._id,
      brand: item.brand,
      type: item.type,
      barcode: item.barcode,
      publicPrice: item.publicPrice,
      clientPrice: item.clientPrice,
      clientName: item.clientId ? `${item.clientId.firstName} ${item.clientId.lastName}` : 'Inconnu'
    };
  });
});

const totalClientGain = computed(() => {
  return populatedArticles.value.reduce((sum, item) => sum + item.clientPrice, 0);
});

const totalBoutiqueGain = computed(() => {
  return populatedArticles.value.reduce((sum, item) => sum + (item.publicPrice - item.clientPrice), 0);
});

const printReceipt = () => {
  const content = document.getElementById('receipt-preview-content');
  if (!content) return;

  const printWindow = window.open('', '', 'height=800,width=800');
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour imprimer.");
    return;
  }

  // Get current styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('');
      } catch (e) {
        return '';
      }
    })
    .join('\n');

  printWindow.document.write(`
    <html>
      <head>
        <title>Impression Bordereau</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { padding: 20px; font-family: sans-serif; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        <\/script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};
</script>
