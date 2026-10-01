<template>
  <Modal :open="isOpen" title="Scanner un Code-barres" @update:open="closeModal">
    <form @submit.prevent="submitScanner" class="space-y-4 p-2">
      <p class="text-sm text-gray-500 text-center">
        Veuillez scanner ou taper le code-barres (ex: 0000045).
      </p>
      <div>
        <input 
          type="text" 
          v-model="scannedCode"
          ref="scannerInput"
          placeholder="0000001" 
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border" 
          required 
          autofocus
          :disabled="isScanLoading"
          @keydown="handleKeydown"
        />
      </div>
      <p v-if="scanError" class="text-sm text-red-600 text-center font-medium">{{ scanError }}</p>
      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          @click="closeModal"
          class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="isScanLoading"
          class="bg-black border border-transparent text-white hover:bg-gray-800 px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        >
          {{ isScanLoading ? 'Recherche...' : 'Valider' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import Modal from './Modal.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'scanned', code: string): void;
}>();

const scannedCode = ref('');
const scanError = ref<string | null>(null);
const isScanLoading = ref(false);
const scannerInput = ref<HTMLInputElement | null>(null);

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    scannedCode.value = '';
    scanError.value = null;
    isScanLoading.value = false;
    nextTick(() => {
      setTimeout(() => scannerInput.value?.focus(), 100);
    });
  }
});

const closeModal = () => {
  emit('close');
};

const handleKeydown = (e: KeyboardEvent) => {
  // Allow Ctrl/Cmd/Alt shortcuts
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  
  // Intercept physical number keys regardless of keyboard layout
  if (e.code.startsWith('Digit')) {
    e.preventDefault();
    scannedCode.value += e.code.replace('Digit', '');
  } else if (e.code.startsWith('Numpad') && e.code.length === 7) {
    e.preventDefault();
    scannedCode.value += e.code.replace('Numpad', '');
  }
};

const submitScanner = () => {
  const code = scannedCode.value.trim().toUpperCase();
  if (!code) return;
  
  // Emit the raw code, let the parent component handle API calls/logic
  emit('scanned', code);
  closeModal();
};
</script>
