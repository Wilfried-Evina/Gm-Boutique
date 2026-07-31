<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from './ui/Modal.vue';
import { getCgu } from '../api/settings';

const props = defineProps<{ open: boolean; showAccept?: boolean }>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'accept'): void;
}>();

const content = ref('');
const version = ref<string | undefined>();
const loading = ref(false);
let loaded = false;

async function load() {
  if (loaded) return;
  loading.value = true;
  try {
    const cgu = await getCgu();
    content.value = cgu.content;
    version.value = cgu.version;
    loaded = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) load();
  },
  { immediate: true }
);

function accept() {
  emit('accept');
  emit('update:open', false);
}
</script>

<template>
  <Modal :open="open" title="Conditions Générales — GM Boutique" @update:open="emit('update:open', $event)">
    <div v-if="loading" class="py-10 text-center text-sm text-gray-500">Chargement des conditions…</div>
    <div v-else>
      <p v-if="version" class="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-3">
        Version {{ version }}
      </p>
      <div class="text-[13px] leading-relaxed text-gray-700 whitespace-pre-line">{{ content }}</div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-10 px-4 rounded-md text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        @click="emit('update:open', false)"
      >
        Fermer
      </button>
      <button
        v-if="showAccept"
        type="button"
        class="h-10 px-5 rounded-md text-[13px] font-medium bg-black text-white hover:bg-gray-800 transition-colors"
        @click="accept"
      >
        J'accepte les CGU
      </button>
    </template>
  </Modal>
</template>
