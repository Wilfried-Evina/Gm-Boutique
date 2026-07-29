<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  page: number;
  totalPages: number;
  total: number;
}>();

const emit = defineEmits<{ (e: 'update:page', value: number): void }>();

const canPrev = computed(() => props.page > 1);
const canNext = computed(() => props.page < props.totalPages);

function go(p: number) {
  if (p >= 1 && p <= props.totalPages && p !== props.page) emit('update:page', p);
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 text-[13px] text-muted-foreground">
    <span>{{ total }} résultat{{ total > 1 ? 's' : '' }}</span>
    <div class="flex items-center gap-2">
      <button
        class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-card hover:bg-black/[0.03] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="!canPrev"
        @click="go(page - 1)"
      >
        <ChevronLeft class="w-4 h-4" :stroke-width="1.75" />
        Précédent
      </button>
      <span class="px-2 text-foreground font-medium">{{ page }} / {{ Math.max(totalPages, 1) }}</span>
      <button
        class="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-card hover:bg-black/[0.03] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="!canNext"
        @click="go(page + 1)"
      >
        Suivant
        <ChevronRight class="w-4 h-4" :stroke-width="1.75" />
      </button>
    </div>
  </div>
</template>
