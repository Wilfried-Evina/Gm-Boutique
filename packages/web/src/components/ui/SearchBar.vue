<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    debounce?: number;
  }>(),
  { placeholder: 'Rechercher…', debounce: 350 }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const local = ref(props.modelValue);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue,
  (v) => {
    if (v !== local.value) local.value = v;
  }
);

watch(local, (v) => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => emit('update:modelValue', v), props.debounce);
});

function clear() {
  local.value = '';
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="relative w-full max-w-sm">
    <Search
      class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none"
      :stroke-width="1.5"
    />
    <input
      v-model="local"
      :placeholder="placeholder"
      class="w-full h-10 pl-9 pr-9 bg-card border border-border rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition"
    />
    <button
      v-if="local"
      class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-black/5 transition-colors"
      aria-label="Effacer"
      @click="clear"
    >
      <X class="w-4 h-4" :stroke-width="1.75" />
    </button>
  </div>
</template>
