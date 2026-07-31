<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    /** Recherche des suggestions (déjà filtrées côté source). */
    fetcher: (query: string) => Promise<string[]>;
    /** Ajout d'une nouvelle entrée. Si absent, le bouton "+" est masqué. */
    creator?: (name: string) => Promise<string>;
    debounce?: number;
  }>(),
  { debounce: 300 }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const open = ref(false);
const suggestions = ref<string[]>([]);
const loading = ref(false);
const creating = ref(false);
const highlighted = ref(-1);
let timer: ReturnType<typeof setTimeout> | undefined;
let seq = 0;

const canCreate = computed(() => {
  const q = props.modelValue.trim();
  if (!props.creator || !q) return false;
  return !suggestions.value.some((s) => s.toLowerCase() === q.toLowerCase());
});

const totalItems = computed(() => suggestions.value.length + (canCreate.value ? 1 : 0));

function runFetch(query: string) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const my = ++seq;
    loading.value = true;
    try {
      const res = await props.fetcher(query.trim());
      if (my === seq) {
        suggestions.value = res;
        highlighted.value = -1;
      }
    } catch {
      if (my === seq) suggestions.value = [];
    } finally {
      if (my === seq) loading.value = false;
    }
  }, props.debounce);
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  emit('update:modelValue', v);
  open.value = true;
  runFetch(v);
}

function onFocus() {
  open.value = true;
  runFetch(props.modelValue);
}

function onBlur() {
  // Léger délai pour laisser passer le clic sur une suggestion.
  setTimeout(() => {
    open.value = false;
    highlighted.value = -1;
  }, 120);
}

function select(value: string) {
  emit('update:modelValue', value);
  open.value = false;
  highlighted.value = -1;
}

async function create() {
  const name = props.modelValue.trim();
  if (!name || !props.creator) return;
  creating.value = true;
  try {
    const saved = await props.creator(name);
    select(saved);
  } finally {
    creating.value = false;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    open.value = true;
    if (totalItems.value) highlighted.value = (highlighted.value + 1) % totalItems.value;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (totalItems.value)
      highlighted.value = (highlighted.value - 1 + totalItems.value) % totalItems.value;
  } else if (e.key === 'Enter') {
    if (open.value) {
      e.preventDefault();
      if (highlighted.value >= 0) {
        if (highlighted.value < suggestions.value.length) select(suggestions.value[highlighted.value]);
        else create();
      } else if (canCreate.value) {
        create();
      } else {
        open.value = false;
      }
    }
  } else if (e.key === 'Escape') {
    // Si le dropdown est ouvert, Escape ne ferme que lui (pas la modale parente).
    if (open.value) {
      e.stopPropagation();
      open.value = false;
      highlighted.value = -1;
    }
  }
}
</script>

<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium text-gray-700">{{ label }}</label>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :required="required"
      autocomplete="off"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeydown"
    />

    <ul
      v-if="open && (loading || suggestions.length || canCreate)"
      class="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto border border-gray-200"
    >
      <li v-if="loading" class="px-3 py-2 text-gray-400 select-none">Recherche…</li>

      <li
        v-for="(s, i) in suggestions"
        :key="s"
        class="px-3 py-2 cursor-pointer select-none"
        :class="highlighted === i ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'"
        @mousedown.prevent="select(s)"
        @mouseenter="highlighted = i"
      >
        {{ s }}
      </li>

      <li
        v-if="canCreate"
        class="px-3 py-2 cursor-pointer select-none flex items-center gap-2 border-t border-gray-100 font-medium"
        :class="highlighted === suggestions.length ? 'bg-gray-100 text-black' : 'text-black hover:bg-gray-50'"
        @mousedown.prevent="create"
        @mouseenter="highlighted = suggestions.length"
      >
        <span class="flex items-center justify-center w-5 h-5 rounded bg-black text-white shrink-0">
          <Plus class="w-3.5 h-3.5" :stroke-width="2.5" />
        </span>
        <span class="truncate">
          {{ creating ? 'Ajout…' : `Ajouter « ${modelValue.trim()} »` }}
        </span>
      </li>
    </ul>
  </div>
</template>
