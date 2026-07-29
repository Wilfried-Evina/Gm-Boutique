<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search, X, CornerDownLeft, User } from 'lucide-vue-next';
import type { IClient } from '@gm-boutique/shared';
import { flattenNav, type NavItemData } from '../config/navigation';
import { listClients } from '../api/clients';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

const router = useRouter();
const query = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// Éléments de navigation (recherche locale).
const searchable = flattenNav().filter((i) => i.to);

const navResults = computed<NavItemData[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return searchable;
  return searchable.filter((i) => i.title.toLowerCase().includes(q));
});

// Recherche de clientes (via l'API, avec debounce).
const clientResults = ref<IClient[]>([]);
const searchingClients = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(query, (q) => {
  if (timer) clearTimeout(timer);
  const term = q.trim();
  if (term.length < 2) {
    clientResults.value = [];
    searchingClients.value = false;
    return;
  }
  searchingClients.value = true;
  timer = setTimeout(async () => {
    try {
      const res = await listClients({ search: term, limit: 5 });
      // Ignore si la requête a été dépassée par une plus récente.
      if (query.value.trim() === term) clientResults.value = res.data;
    } catch {
      clientResults.value = [];
    } finally {
      searchingClients.value = false;
    }
  }, 300);
});

function close() {
  emit('update:open', false);
}

function selectNav(item: NavItemData) {
  if (item.to) router.push(item.to);
  close();
}

function selectClient(client: IClient) {
  router.push(`/clients/${client._id}`);
  close();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
  if (e.key === 'Enter') {
    if (clientResults.value.length) selectClient(clientResults.value[0]);
    else if (navResults.value.length) selectNav(navResults.value[0]);
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      query.value = '';
      clientResults.value = [];
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
            placeholder="Rechercher une page ou une cliente…"
          />
          <button
            class="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 hover:text-foreground transition-colors"
            @click="close"
          >
            <X class="w-[18px] h-[18px]" :stroke-width="1.5" />
          </button>
        </div>

        <div class="p-2 max-h-[360px] overflow-y-auto">
          <!-- Clientes -->
          <template v-if="clientResults.length">
            <p class="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Clientes</p>
            <button
              v-for="c in clientResults"
              :key="c._id"
              class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] text-foreground/80 hover:bg-black/5 hover:text-foreground transition-colors"
              @click="selectClient(c)"
            >
              <User class="w-4 h-4 text-muted-foreground/70 shrink-0" :stroke-width="1.5" />
              <span class="flex-1 truncate">{{ c.firstName }} {{ c.lastName }}</span>
              <span class="font-mono text-[11px] text-muted-foreground/60">{{ c.referenceNumber }}</span>
            </button>
          </template>

          <!-- Pages -->
          <p
            v-if="clientResults.length && navResults.length"
            class="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50"
          >
            Pages
          </p>
          <button
            v-for="item in navResults"
            :key="item.id"
            class="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13px] text-foreground/80 hover:bg-black/5 hover:text-foreground transition-colors"
            @click="selectNav(item)"
          >
            <component :is="item.icon" class="w-4 h-4 text-muted-foreground/70 shrink-0" :stroke-width="1.5" />
            <span class="flex-1 truncate">{{ item.title }}</span>
            <CornerDownLeft
              class="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
              :stroke-width="1.5"
            />
          </button>

          <div
            v-if="!navResults.length && !clientResults.length && !searchingClients"
            class="py-10 text-center text-[13px] text-muted-foreground/70"
          >
            Aucun résultat pour « {{ query }} »
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
