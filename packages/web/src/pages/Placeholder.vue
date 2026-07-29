<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Hammer } from 'lucide-vue-next';

const route = useRoute();
const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : 'Page'));
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <h1 class="text-2xl font-semibold tracking-tight text-foreground mb-6">{{ title }}</h1>
    <div
      class="bg-card rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center py-20 px-6"
    >
      <div class="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mb-4">
        <Hammer class="w-5 h-5 text-muted-foreground" :stroke-width="1.5" />
      </div>
      <p class="text-sm font-medium text-foreground">Section « {{ title }} » en construction</p>
      <p class="text-[13px] text-muted-foreground mt-1 max-w-sm">
        Cette partie sera développée prochainement. La navigation et la mise en page sont déjà en place.
      </p>
    </div>
  </div>
</template>
