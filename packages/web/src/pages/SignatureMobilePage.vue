<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    
    <div v-if="loading" class="text-gray-500 animate-pulse">
      Chargement de la session de signature...
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg shadow w-full max-w-md text-center">
      {{ error }}
    </div>

    <div v-else-if="success" class="bg-green-50 text-green-700 p-6 rounded-lg shadow w-full max-w-md text-center flex flex-col items-center gap-4">
      <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-bold">Signature validée</h2>
      <p>Merci. Vous pouvez rendre cet appareil.</p>
    </div>

    <div v-else class="w-full max-w-md flex flex-col gap-6 bg-white p-6 rounded-xl shadow-lg">
      
      <!-- En-tête dynamique selon le contexte -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isFirstDeposit ? "Bienvenue chez Gm-Boutique" : "Validation" }}
        </h1>
        <p class="text-gray-500 mt-2 text-sm">
          {{ isFirstDeposit ? "Veuillez accepter nos conditions et signer ci-dessous." : "Veuillez apposer votre signature pour confirmer." }}
        </p>
      </div>

      <!-- CGU (Uniquement pour le premier dépôt) -->
      <div v-if="isFirstDeposit" class="flex flex-col gap-4">
        <div class="bg-gray-100 p-4 rounded text-xs text-gray-700 h-32 overflow-y-auto border border-gray-200">
          <p class="font-semibold mb-1">Conditions Générales d'Utilisation et de Dépôt-Vente :</p>
          <p class="mb-2">1. Les articles déposés restent la propriété du déposant jusqu'à leur vente.</p>
          <p class="mb-2">2. Gm-Boutique fixe le prix de vente en accord avec le déposant et prélève une commission sur chaque vente selon le barème en vigueur.</p>
          <p class="mb-2">3. Les articles invendus doivent être récupérés à l'issue de la période contractuelle. À défaut, ils pourront être soldés ou donnés à une œuvre caritative.</p>
          <p>En signant, je confirme avoir lu et accepté l'intégralité de ces conditions.</p>
        </div>
        
        <label class="flex items-start gap-3 cursor-pointer p-2 border rounded hover:bg-gray-50">
          <input 
            type="checkbox" 
            v-model="cguAccepted" 
            class="mt-1 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          >
          <span class="text-sm font-medium text-gray-700 select-none">
            J'ai lu et j'accepte les Conditions Générales d'Utilisation
          </span>
        </label>
      </div>

      <!-- Zone de signature -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Votre signature :</label>
        <div class="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 relative">
          <canvas ref="signatureCanvas" class="w-full h-48 touch-none"></canvas>
          <button 
            @click="clearSignature" 
            class="absolute top-2 right-2 p-1 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors text-xs px-2"
          >
            Effacer
          </button>
        </div>
      </div>

      <!-- Bouton Valider -->
      <button 
        @click="submitSignature"
        :disabled="isSubmitting || (isFirstDeposit && !cguAccepted)"
        class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        <span v-if="isSubmitting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Valider et Envoyer</span>
      </button>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import SignaturePad from 'signature_pad';
import { apiClient } from '../api/client';

const route = useRoute();
const token = route.params.token as string;

const loading = ref(true);
const error = ref('');
const success = ref(false);
const isSubmitting = ref(false);

const isFirstDeposit = ref(false);
const cguAccepted = ref(false);

const signatureCanvas = ref<HTMLCanvasElement | null>(null);
let signaturePad: SignaturePad | null = null;

const initSignaturePad = () => {
  if (!signatureCanvas.value) return;
  const canvas = signatureCanvas.value;
  
  // Ajuster la résolution du canvas pour éviter le flou sur les écrans retina
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d')?.scale(ratio, ratio);

  signaturePad = new SignaturePad(canvas, {
    penColor: 'black',
    minWidth: 1.5,
    maxWidth: 3
  });
};

const clearSignature = () => {
  if (signaturePad) {
    signaturePad.clear();
  }
};

const fetchSession = async () => {
  try {
    const response = await apiClient.get(`/signatures/session/${token}`);
    const data = response.data;
    
    if (data.status !== 'pending') {
      error.value = "Cette session de signature a déjà été complétée ou a expiré.";
      loading.value = false;
      return;
    }

    isFirstDeposit.value = data.signatureType === 'first_deposit';
    loading.value = false;

    // Initialiser le pad après le rendu du DOM
    setTimeout(initSignaturePad, 100);

  } catch (err: any) {
    error.value = err.response?.data?.message || "Lien invalide ou expiré.";
    loading.value = false;
  }
};

const submitSignature = async () => {
  if (!signaturePad || signaturePad.isEmpty()) {
    alert("Veuillez dessiner votre signature avant de valider.");
    return;
  }

  if (isFirstDeposit.value && !cguAccepted.value) {
    alert("Veuillez accepter les CGU.");
    return;
  }

  isSubmitting.value = true;
  error.value = '';

  const base64Signature = signaturePad.toDataURL('image/png');

  try {
    await apiClient.post(`/signatures/${token}/submit`, {
      signatureBase64: base64Signature,
      cguAccepted: cguAccepted.value
    });
    
    success.value = true;
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur lors de l'envoi de la signature.";
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchSession();
  
  // Gérer le redimensionnement
  window.addEventListener('resize', initSignaturePad);
});

onUnmounted(() => {
  window.removeEventListener('resize', initSignaturePad);
});
</script>
