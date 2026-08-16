<template>
  <div class="relative" ref="containerRef">
    <label v-if="label" class="block text-sm font-medium text-gray-700">{{ label }}</label>
    <div class="mt-1 relative">
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        @input="onInput"
        @focus="onFocus"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border bg-white disabled:bg-gray-100 disabled:text-gray-500"
        autocomplete="new-password"
      />
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- Dropdown suggestions -->
      <ul
        v-if="isOpen && suggestions.length > 0"
        class="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-48 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200"
      >
        <li
          v-for="(suggestion, index) in suggestions"
          :key="index"
          @click="selectSuggestion(suggestion)"
          class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 text-gray-900"
        >
          <span class="block truncate font-medium">{{ suggestion }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { articlesApi } from '../../api/articles';

const props = defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  field: 'brand' | 'type' | 'color';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const suggestions = ref<string[]>([]);
const isOpen = ref(false);
const isLoading = ref(false);
let debounceTimeout: any = null;

const fetchSuggestions = async (q: string) => {
  if (q.length < 2) {
    suggestions.value = [];
    isOpen.value = false;
    return;
  }
  
  isLoading.value = true;
  try {
    const results = await articlesApi.getSuggestions(props.field, q);
    // Enlever les doublons exacts (espaces en trop, différences de majuscules)
    const uniqueResults = Array.from(new Set(results.map(s => s.trim().toLowerCase()))).map(
      lower => results.find(s => s.trim().toLowerCase() === lower)!
    );
    // Filtrer pour ne pas afficher la suggestion si elle est exactement égale à ce qui est tapé (case insensitive)
    suggestions.value = uniqueResults.filter(s => s.trim().toLowerCase() !== q.trim().toLowerCase());
    isOpen.value = suggestions.value.length > 0;
  } catch (err) {
    console.error('Failed to fetch suggestions:', err);
    suggestions.value = [];
  } finally {
    isLoading.value = false;
  }
};

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = target.value;
  emit('update:modelValue', val);
  
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchSuggestions(val);
  }, 300); // 300ms debounce
};

const onFocus = () => {
  if (props.modelValue.length >= 2) {
    fetchSuggestions(props.modelValue);
  }
};

const selectSuggestion = (suggestion: string) => {
  emit('update:modelValue', suggestion);
  isOpen.value = false;
};

const onClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
  clearTimeout(debounceTimeout);
});
</script>
