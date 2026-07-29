<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';
import { useNotificationsStore, type ToastType } from '../stores/notifications';

const store = useNotificationsStore();

const icons: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const accents: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-foreground/70',
};
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="t in store.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-3 bg-card border border-border/60 rounded-xl shadow-lg px-4 py-3"
      >
        <component :is="icons[t.type]" class="w-[18px] h-[18px] mt-0.5 shrink-0" :class="accents[t.type]" :stroke-width="1.75" />
        <p class="flex-1 text-[13px] text-foreground leading-snug">{{ t.message }}</p>
        <button
          class="shrink-0 p-0.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-black/5 transition-colors"
          aria-label="Fermer"
          @click="store.dismiss(t.id)"
        >
          <X class="w-4 h-4" :stroke-width="1.75" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
