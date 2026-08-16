<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- HEADER -->
      <div class="flex items-center justify-center relative px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 class="text-lg font-bold text-gray-900">Ticket de Caisse</h3>
        <button @click="close" class="absolute right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- CONTENT (Preview) -->
      <div class="flex-1 overflow-y-auto p-6 bg-gray-100/50 flex justify-center">
        <!-- Ticket Client Preview (Thermal size) -->
        <div class="bg-white p-6 shadow-md border border-gray-200 w-[80mm] min-h-[150mm] font-mono text-sm text-center flex flex-col items-center">
          <img src="/logo.png" class="w-full max-w-[120px] mb-2 object-contain" alt="GM BOUTIQUE" />
          <p class="mb-4 text-xs">Ticket de Caisse</p>
          
          <div class="w-full text-left text-xs mb-4">
            <p>Réf: {{ sale?.reference }}</p>
            <p>{{ formattedDate }}</p>
          </div>
          
          <div class="w-full border-t border-dashed border-gray-400 my-2"></div>
          
          <table class="w-full text-left text-xs mb-2">
            <thead>
              <tr>
                <th class="pb-2">Article</th>
                <th class="pb-2 text-right">Prix</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in populatedArticles" :key="item._id">
                <td class="py-1 pr-2">
                  <div class="font-bold">{{ item.brand }} - {{ item.type }}</div>
                  <div class="text-[10px] text-gray-500">{{ item.barcode }}</div>
                </td>
                <td class="py-1 text-right font-bold">{{ item.publicPrice.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="w-full border-t border-dashed border-gray-400 my-2"></div>
          
          <div class="w-full flex justify-between font-bold text-base my-2">
            <span>TOTAL</span>
            <span>{{ sale?.totalAmount.toFixed(2) }} CHF</span>
          </div>
          
          <div class="w-full border-t border-dashed border-gray-400 my-2"></div>
          
          <div class="w-full text-center text-xs mt-4">
            <p>Paiement: {{ paymentMethodLabel }}</p>
            <p class="mt-4">Merci de votre visite et à bientôt !</p>
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
    };
  });
});

const printReceipt = () => {
  const printWindow = window.open('', '', 'height=800,width=400');
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour imprimer.");
    return;
  }

  let itemsHtml = '';
  populatedArticles.value.forEach(item => {
    itemsHtml += `
      <tr>
        <td style="padding-bottom: 4px;">
          <strong>${item.brand} - ${item.type}</strong><br>
          <small style="color: #666;">${item.barcode}</small>
        </td>
        <td style="text-align: right; vertical-align: top; padding-bottom: 4px;">
          <strong>${item.publicPrice.toFixed(2)}</strong>
        </td>
      </tr>
    `;
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket de Caisse</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            color: black; 
            background: white; 
          }
          .thermal-receipt {
            width: 80mm;
            padding: 5mm;
          }
          .thermal-header, .thermal-footer {
            text-align: center;
            margin-bottom: 10px;
          }
          .thermal-header h1 {
            font-size: 18px;
            margin: 0 0 5px 0;
          }
          .thermal-header p, .thermal-footer p {
            margin: 2px 0;
            font-size: 12px;
          }
          .thermal-divider {
            text-align: center;
            margin: 5px 0;
            font-size: 12px;
          }
          .thermal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
          }
          .thermal-table th, .thermal-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          @media print {
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="thermal-receipt">
          <div class="thermal-header">
            <img src="${window.location.origin}/logo.png" style="width: 100%; max-width: 120px; margin: 0 auto 5px auto; display: block;" alt="GM BOUTIQUE" />
            <p>Ticket de Caisse</p>
            <p>Réf: ${props.sale?.reference}</p>
            <p>${formattedDate.value}</p>
          </div>
          <div class="thermal-divider">--------------------------------</div>
          <table class="thermal-table">
            <thead>
              <tr>
                <th style="text-align: left;">Article</th>
                <th style="text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="thermal-divider">--------------------------------</div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;">
            <span>TOTAL</span>
            <span>${props.sale?.totalAmount.toFixed(2)} CHF</span>
          </div>
          <div class="thermal-divider">--------------------------------</div>
          <div class="thermal-footer">
            <p>Paiement: ${paymentMethodLabel.value}</p>
            <p>Merci de votre visite et à bientôt !</p>
          </div>
        </div>
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
