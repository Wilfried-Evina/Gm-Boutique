<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, X, CornerDownLeft } from 'lucide-vue-next';
import { flattenNav, type NavItemData } from '../config/navigation';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

const router = useRouter();
const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// Seuls les éléments navigables (pas la recherche elle-même ni la déconnexion).
const searchable = flattenNav().filter((i) => i.to);

const results = computed<NavItemData[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return searchable;
  return searchable.filter((i) => i.title.toLowerCase().includes(q));
});

function close() {
  emit('update:open', false);
}

function select(item: NavItemData) {
  if (item.to) router.push(item.to);
  close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
  if (e.key === 'Enter' && results.value.length) select(results.value[0]);
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      query.value = '';
      await nextTick();
      inputRef.value?.focus();
    }
  }
);
</script>

<template>
  <Transition name="gm-fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm px-4"
      @keydown="onKeydown"
    >
      <div class="absolute inset-0" @click="close" />
      <div
        class="gm-enter-active relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden"
      >
        <div class="flex items-center px-4 border-b border-border/50">
          <Search class="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0" :stroke-width="1.5" />
          <input
            ref="inputRef"
            v-model="query"
            class="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
            placeholder="Rechercher une page ou une action…"
          />
          <button
            class="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
            @click="close"
          >
            <X class="w-[18px] h-[18px]" :stroke-width="1.5" />
          </button>
        </div>

        <div class="p-2 max-h-[320px] overflow-y-auto">
          <button
            v-for="item in results"
            :key="item.id"
            class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] text-foreground/80 hover:bg-black/5 hover:text-foreground transition-colors"
            @click="select(item)"
          >
            <component :is="item.icon" class="w-4 h-4 text-muted-foreground/70 shrink-0" :stroke-width="1.5" />
            <span class="flex-1 truncate">{{ item.title }}</span>
            <CornerDownLeft
              class="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
              :stroke-width="1.5"
            />
          </button>

          <div
            v-if="!results.length"
            class="py-10 text-center text-[13px] text-muted-foreground/70"
          >
            Aucun résultat pour « {{ query }} »
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
