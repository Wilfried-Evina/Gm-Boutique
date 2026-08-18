<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center relative animate-in fade-in zoom-in-95 duration-200">
        
        <button @click="close" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 class="text-xl font-bold text-gray-800 mb-2">
          {{ signatureType === 'retrocession' ? 'Signature Quittance (Espèces)' : 'Signature Déposante' }}
        </h2>
        <p class="text-sm text-gray-500 mb-6">
          {{
            signatureType === 'retrocession'
              ? 'Demandez à la déposante de scanner ce QR Code avec son smartphone pour signer la quittance de versement.'
              : 'Demandez à la déposante de scanner ce QR Code avec son smartphone pour signer.'
          }}
        </p>

        <!-- Zone du QR Code -->
        <div v-if="loading" class="w-48 h-48 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center mb-4">
          <span class="text-sm text-gray-400">Génération...</span>
        </div>
        
        <div v-else-if="error" class="w-48 h-48 bg-red-50 text-red-500 flex flex-col items-center justify-center p-4 rounded-lg mb-4 text-sm">
          <p>{{ error }}</p>
          <button @click="generateQrCode" class="mt-2 underline text-red-600">Réessayer</button>
        </div>
        
        <div v-else class="p-2 bg-white border rounded-xl shadow-sm mb-4">
          <qrcode-vue :value="qrCodeUrl" :size="200" level="M" />
        </div>

        <!-- Statut -->
        <div class="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full text-sm font-medium">
          <span class="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span>
          En attente de la signature...
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { apiClient } from '../../api/client';

const props = defineProps<{
  isOpen: boolean;
  signatureType: 'first_deposit' | 'standard' | 'retrocession';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'signed', payload: { signatureBase64: string, cguAccepted: boolean }): void;
}>();

const loading = ref(false);
const error = ref('');
const token = ref('');
const qrCodeUrl = ref('');
let pollingInterval: number | null = null;

const generateQrCode = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await apiClient.post('/signatures/request', {
      signatureType: props.signatureType
    });
    
    token.value = response.data.token;
    // Construire l'URL accessible depuis le réseau local (pas localhost)
    let baseUrl = window.location.origin;
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Remplacer localhost par l'IP réseau pour que le téléphone puisse y accéder
      try {
        const networkRes = await apiClient.get('/network-info');
        const networkIp = networkRes.data.ip;
        if (networkIp) {
          baseUrl = `${window.location.protocol}//${networkIp}:${window.location.port}`;
        }
      } catch {
        // Fallback : on garde localhost (ne fonctionnera pas sur le téléphone)
        console.warn('Impossible de récupérer l\'IP réseau, le QR code utilisera localhost.');
      }
    }
    qrCodeUrl.value = `${baseUrl}/sign/${token.value}`;
    
    startPolling();
  } catch (err: any) {
    error.value = "Erreur lors de la génération du QR Code.";
  } finally {
    loading.value = false;
  }
};

const startPolling = () => {
  stopPolling();
  pollingInterval = window.setInterval(checkStatus, 2000); // Check toutes les 2 secondes
};

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

const checkStatus = async () => {
  if (!token.value) return;
  
  try {
    const response = await apiClient.get(`/signatures/${token.value}`);
    if (response.data.status === 'completed') {
      stopPolling();
      // On prévient le parent (la facture ou la fiche client)
      emit('signed', {
        signatureBase64: response.data.signatureBase64,
        cguAccepted: response.data.cguAccepted
      });
    }
  } catch (err) {
    console.error("Erreur polling signature", err);
  }
};

const close = () => {
  stopPolling();
  emit('close');
};

// Quand la modale s'ouvre, on génère un nouveau token
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    generateQrCode();
  } else {
    stopPolling();
    token.value = '';
    qrCodeUrl.value = '';
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>
