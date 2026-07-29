<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps<{ open: boolean; title?: string }>();
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

function close() {
  emit('update:open', false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close();
}

// Verrouille le défilement du corps quand la modale est ouverte.
watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
);

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="gm-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4 bg-background/50 backdrop-blur-sm"
      >
        <div class="absolute inset-0" @click="close" />
        <div
          class="gm-enter-active relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
            <h2 class="text-sm font-semibold text-foreground">{{ title }}</h2>
            <button
              class="p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
              aria-label="Fermer"
              @click="close"
            >
              <X class="w-[18px] h-[18px]" :stroke-width="1.5" />
            </button>
          </div>
          <div class="px-6 py-5 overflow-y-auto">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-border/50 shrink-0 flex justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
