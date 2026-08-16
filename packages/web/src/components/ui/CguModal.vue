<template>
  <Modal :open="open" title="Conditions Générales de GM Boutique" @update:open="$emit('update:open', $event)">
    <div class="space-y-4 text-sm text-gray-700 min-h-[300px] max-h-[60vh] overflow-y-auto">
      <div v-if="loading" class="flex justify-center items-center h-40">
        <span class="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></span>
      </div>
      <div v-else-if="error" class="text-red-500 text-center py-10">
        {{ error }}
      </div>
      <div v-else class="prose prose-sm max-w-none" v-html="formattedText"></div>
    </div>
    
    <template #footer>
      <button
        type="button"
        class="h-10 px-5 rounded-lg text-[13px] font-medium bg-black text-white hover:bg-gray-800 transition-colors w-full sm:w-auto"
        @click="$emit('update:open', false)"
      >
        Fermer
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { apiClient } from '../../api/client';
import Modal from './Modal.vue';

const props = defineProps<{
  open: boolean;
}>();

defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const error = ref('');
const cguText = ref('');

const fetchCgu = async () => {
  if (cguText.value) return; // Déjà chargé
  loading.value = true;
  error.value = '';
  try {
    const response = await apiClient.get('/settings/cgu');
    cguText.value = response.data.text;
  } catch (err) {
    error.value = 'Erreur lors du chargement des CGU.';
  } finally {
    loading.value = false;
  }
};

const formattedText = computed(() => {
  if (!cguText.value) return '';
  // Transform markdown-like text to HTML roughly
  let html = cguText.value
    .replace(/### (.*)/g, '<strong>$1</strong><br/>')
    .replace(/\n/g, '<br/>')
    .replace(/\*(.*)\*/g, '<em>$1</em>');
  return html;
});

watch(() => props.open, (isOpen) => {
  if (isOpen) fetchCgu();
});
</script>
