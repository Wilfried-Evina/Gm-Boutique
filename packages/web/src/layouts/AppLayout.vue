<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { flattenNav } from '../config/navigation';
import SidebarNav from '../components/sidebar/SidebarNav.vue';
import CommandPalette from '../components/CommandPalette.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notify = useNotificationsStore();

const sidebarOpen = ref(true);
const paletteOpen = ref(false);

const currentTitle = computed(() => {
  if (typeof route.meta.title === 'string') return route.meta.title;
  const item = flattenNav().find((i) => i.to && i.to.split('?')[0] === route.path);
  return item?.title ?? 'Tableau de bord';
});

const userLabel = computed(() => {
  const u = authStore.user;
  if (u?.firstName || u?.lastName) return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return u?.email ?? 'Gérante';
});

const userInitial = computed(() => userLabel.value.charAt(0).toUpperCase());

function handleAction(action: 'search' | 'logout') {
  if (action === 'search') paletteOpen.value = true;
  if (action === 'logout') {
    authStore.logout();
    notify.info('Tu as été déconnectée.');
    router.push('/login');
  }
}

function onNavigate() {
  // Referme la barre latérale sur petit écran après une navigation.
  if (window.innerWidth < 768) sidebarOpen.value = false;
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    paletteOpen.value = true;
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="flex h-screen bg-background font-sans text-foreground overflow-hidden">
    <!-- Fond sombre (mobile) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/30 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Barre latérale -->
    <aside
      class="fixed md:relative inset-y-0 left-0 z-40 h-full shrink-0 overflow-hidden bg-card/60 border-r border-border/50 transition-[width] duration-300 ease-in-out"
      :class="sidebarOpen ? 'w-[260px]' : 'w-0 border-transparent'"
    >
      <SidebarNav @action="handleAction" @navigate="onNavigate" />
    </aside>

    <!-- Zone principale -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- En-tête -->
      <header
        class="h-14 shrink-0 border-b border-border/50 bg-card flex items-center px-4 justify-between"
      >
        <div class="flex items-center gap-3 min-w-0">
          <button
            class="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
            :aria-label="sidebarOpen ? 'Réduire le menu' : 'Ouvrir le menu'"
            @click="sidebarOpen = !sidebarOpen"
          >
            <PanelLeftClose v-if="sidebarOpen" class="w-[18px] h-[18px]" :stroke-width="1.5" />
            <PanelLeftOpen v-else class="w-[18px] h-[18px]" :stroke-width="1.5" />
          </button>
          <div class="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <span class="truncate">GM Boutique</span>
            <span class="text-muted-foreground/40">/</span>
            <span class="font-medium text-foreground truncate">{{ currentTitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="hidden md:flex items-center gap-2 w-64 h-8 px-3 bg-black/5 hover:bg-black/[0.07] rounded-md text-[13px] text-muted-foreground/70 transition-colors"
            @click="paletteOpen = true"
          >
            <Search class="w-4 h-4 shrink-0" :stroke-width="1.5" />
            <span class="flex-1 text-left">Rechercher…</span>
            <kbd
              class="inline-flex items-center h-5 px-1.5 text-[10px] font-mono border border-border/60 rounded bg-card"
            >
              ⌘K
            </kbd>
          </button>
          <div
            class="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[13px] font-semibold text-primary"
            :title="userLabel"
          >
            {{ userInitial }}
          </div>
        </div>
      </header>

      <!-- Contenu de la page -->
      <main class="flex-1 overflow-y-auto bg-black/[0.015] p-6 md:p-8">
        <router-view v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
      </main>
    </div>

    <CommandPalette v-model:open="paletteOpen" />
  </div>
</template>
