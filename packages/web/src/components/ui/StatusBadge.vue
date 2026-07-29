<script setup lang="ts">
import { computed } from 'vue';
import { ArticleStatus } from '@gm-boutique/shared';

const props = defineProps<{ status: string }>();

const map: Record<string, { label: string; classes: string }> = {
  [ArticleStatus.DEPOSITED]: { label: 'Déposé', classes: 'bg-black/5 text-foreground/70' },
  [ArticleStatus.ON_SALE]: { label: 'En vente', classes: 'bg-blue-50 text-blue-700' },
  [ArticleStatus.SOLD]: { label: 'Vendu', classes: 'bg-emerald-50 text-emerald-700' },
  [ArticleStatus.RETURNED]: { label: 'Retourné', classes: 'bg-amber-50 text-amber-700' },
};

const badge = computed(
  () => map[props.status] ?? { label: props.status, classes: 'bg-black/5 text-foreground/70' }
);
</script>

<template>
  <span
    class="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium"
    :class="badge.classes"
  >
    {{ badge.label }}
  </span>
</template>
