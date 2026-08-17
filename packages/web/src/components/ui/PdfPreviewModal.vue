<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { X, Download, Printer } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  blobUrl: string;
  fileName?: string;
  title?: string;
}>();

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

const iframeRef = ref<HTMLIFrameElement | null>(null);

function close() {
  emit('update:open', false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close();
}

function download() {
  const a = document.createElement('a');
  a.href = props.blobUrl;
  a.download = props.fileName || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function print() {
  const iframe = iframeRef.value;
  try {
    iframe?.contentWindow?.focus();
    iframe?.contentWindow?.print();
  } catch {
    // Repli : ouvrir le PDF dans un nouvel onglet pour l'imprimer manuellement.
    window.open(props.blobUrl, '_blank');
  }
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
);

window.addEventListener('keydown', onKeydown);
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm"
    >
      <div class="absolute inset-0" @click="close" />
      <div class="relative w-full max-w-4xl h-[85vh] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <!-- En-tête -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0">
          <h2 class="text-sm font-semibold text-foreground truncate">{{ title || 'Aperçu du document' }}</h2>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors"
              @click="print"
            >
              <Printer class="w-4 h-4" :stroke-width="1.75" />
              Imprimer
            </button>
            <button
              class="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              @click="download"
            >
              <Download class="w-4 h-4" :stroke-width="1.75" />
              Télécharger
            </button>
            <button
              class="p-1.5 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
              aria-label="Fermer"
              @click="close"
            >
              <X class="w-[18px] h-[18px]" :stroke-width="1.5" />
            </button>
          </div>
        </div>

        <!-- Aperçu PDF -->
        <div class="flex-1 min-h-0 bg-black/[0.04]">
          <iframe
            v-if="blobUrl"
            ref="iframeRef"
            :src="blobUrl"
            class="w-full h-full border-0"
            title="Aperçu PDF"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>
