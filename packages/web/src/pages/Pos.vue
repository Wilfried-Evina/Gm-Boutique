<template>
  <div class="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 p-6 bg-gray-50/50">
    
    <!-- Left Section: Scanner & Cart -->
    <div class="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      
      <!-- Scanner Input -->
      <div class="p-6 border-b border-gray-100 bg-white">
        <form @submit.prevent="handleScan" class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <input
            ref="scannerInput"
            v-model="barcodeInput"
            type="text"
            class="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-xl text-lg font-mono focus:border-black focus:bg-white focus:ring-0 transition-colors"
            placeholder="Scannez un code-barres..."
            autofocus
            :disabled="posStore.isProcessing"
          />
        </form>
      </div>

      <!-- Cart List -->
      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="posStore.cart.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
          <svg class="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p class="text-sm font-medium">Le panier est vide</p>
        </div>
        
        <ul v-else class="space-y-2 p-4">
          <li v-for="item in posStore.cart" :key="item._id" class="flex items-center justify-between p-4 bg-white border border-gray-100 hover:border-gray-300 rounded-xl shadow-sm transition-all group">
            <div class="flex flex-col">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ item.brand }} - {{ item.type }}
              </p>
              <p class="text-sm text-gray-500 truncate">
                {{ item.barcode }} | {{ item.color }} {{ item.size ? `| Taille: ${item.size}` : '' }}
              </p>
              <p v-if="item.clientId" class="text-xs font-medium text-indigo-600 mt-0.5">
                Déposante : {{ item.clientId.firstName }} {{ item.clientId.lastName }}
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex flex-col items-end">
                <span class="text-xl font-bold text-gray-900">{{ item.publicPrice.toFixed(2) }} CHF</span>
              </div>
              <button @click="posStore.removeFromCart(item._id)" class="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Retirer">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Right Section: Checkout -->
    <div class="w-full md:w-96 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-6">Récapitulatif</h2>
      
      <div class="flex justify-between items-center mb-4 text-gray-500">
        <span>Articles</span>
        <span class="font-medium">{{ posStore.cart.length }}</span>
      </div>
      
      <div class="border-t border-gray-200 my-4"></div>
      
      <div class="flex justify-between items-end mb-8">
        <span class="text-xl font-semibold text-gray-900">Total</span>
        <span class="text-4xl font-black text-black">{{ posStore.totalAmount.toFixed(2) }} CHF</span>
      </div>

      <!-- Payment Methods -->
      <div class="space-y-3 mb-8">
        <p class="text-sm font-medium text-gray-500 mb-2">Moyen de paiement</p>
        
        <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all"
          :class="paymentMethod === 'card' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            <span class="font-medium">Carte Bancaire</span>
          </div>
          <input type="radio" v-model="paymentMethod" value="card" class="text-black focus:ring-black">
        </label>

        <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all"
          :class="paymentMethod === 'cash' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="font-medium">Espèces</span>
          </div>
          <input type="radio" v-model="paymentMethod" value="cash" class="text-black focus:ring-black">
        </label>
        
        <label class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all"
          :class="paymentMethod === 'twint' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            <span class="font-medium">TWINT</span>
          </div>
          <input type="radio" v-model="paymentMethod" value="twint" class="text-black focus:ring-black">
        </label>
      </div>

      <button 
        @click="processCheckout"
        :disabled="posStore.cart.length === 0 || posStore.isProcessing"
        class="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span v-if="!posStore.isProcessing">Encaisser</span>
        <svg v-else class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </button>

      <button 
        v-if="posStore.cart.length > 0"
        @click="posStore.clearCart()"
        class="w-full mt-4 py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
      >
        Annuler la vente
      </button>
    </div>

    <!-- Receipt Modal -->
    <ReceiptPreviewModal 
      :is-open="isReceiptOpen"
      :sale="currentSale"
      @close="closeReceipt"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { usePosStore } from '../stores/pos';
import type { PaymentMethod, ISale } from '@gm-boutique/shared';
import { useNotificationsStore } from '../stores/notifications';
import ReceiptPreviewModal from '../components/pos/ReceiptPreviewModal.vue';

const posStore = usePosStore();
const notifications = useNotificationsStore();

const barcodeInput = ref('');
const scannerInput = ref<HTMLInputElement | null>(null);
const paymentMethod = ref<PaymentMethod>('card');

const isReceiptOpen = ref(false);
const currentSale = ref<ISale | null>(null);

const handleScan = async () => {
  const code = barcodeInput.value.trim().toUpperCase();
  if (!code) return;
  
  barcodeInput.value = '';
  await posStore.addByBarcode(code);
  
  // Refocus input after scan
  if (scannerInput.value) {
    scannerInput.value.focus();
  }
};

const processCheckout = async () => {
  const sale = await posStore.checkout(paymentMethod.value);
  if (sale) {
    // Show receipt
    currentSale.value = sale;
    isReceiptOpen.value = true;
  }
};

const closeReceipt = () => {
  isReceiptOpen.value = false;
  currentSale.value = null;
  // Refocus input for next sale
  if (scannerInput.value) {
    scannerInput.value.focus();
  }
};

// Global keydown listener to focus scanner input when typing anywhere
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Ignore if typing in another input/textarea
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return;
  }
  
  // If it's a character or number, focus the scanner
  if (e.key.length === 1 && scannerInput.value) {
    scannerInput.value.focus();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
  if (scannerInput.value) {
    scannerInput.value.focus();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>
