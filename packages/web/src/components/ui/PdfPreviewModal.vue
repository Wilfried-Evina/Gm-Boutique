<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue';
import { X, Download, Printer, ExternalLink } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  blobUrl?: string | null;
  pdfUrl?: string | null;
  fileName?: string;
  title?: string;
}>();

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

const srcUrl = computed(() => props.pdfUrl || props.blobUrl || '');

function close() {
  emit('update:open', false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close();
}

function download() {
  if (!srcUrl.value) return;
  const a = document.createElement('a');
  a.href = srcUrl.value;
  a.download = props.fileName || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function openInNewTab() {
  if (!srcUrl.value) return;
  window.open(srcUrl.value, '_blank');
}

// Impression fiable : iframe cachée dédiée (indépendante de l'aperçu <embed>).
function print() {
  if (!srcUrl.value) return;
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.src = srcUrl.value;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(props.blobUrl, '_blank');
    }
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
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
        <div class="flex items-center justify-between px-5 py-3 border-b border-border/60 shrink-0 gap-3">
          <h2 class="text-sm font-semibold text-foreground truncate">{{ title || 'Aperçu du document' }}</h2>
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium border border-border bg-card hover:bg-black/[0.03] transition-colors"
              @click="openInNewTab"
            >
              <ExternalLink class="w-4 h-4" :stroke-width="1.75" />
              Ouvrir
            </button>
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

        <!-- Aperçu PDF (embed = élément le plus fiable ; repli si non supporté) -->
        <div class="flex-1 min-h-0 bg-black/[0.04] flex items-center justify-center">
          <embed
            v-if="srcUrl"
            :src="srcUrl"
            type="application/pdf"
            class="w-full h-full"
          />
          <div v-else class="text-center px-6">
            <p class="text-sm text-muted-foreground">Aucun document à afficher.</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
