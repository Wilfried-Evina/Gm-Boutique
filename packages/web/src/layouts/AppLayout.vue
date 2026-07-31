<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import { flattenNav } from '../config/navigation';
import SidebarNav from '../components/sidebar/SidebarNav.vue';
import CommandPalette from '../components/CommandPalette.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notify = useNotificationsStore();

const paletteOpen = ref(false);
const sidebarHovered = ref(false);

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
  if (window.innerWidth < 768) sidebarHovered.value = false;
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

    <!-- Sidebar: collapsed = 60px icons only, hover = 260px full -->
    <aside
      class="relative z-40 h-full shrink-0 bg-white border-r border-gray-200/60 transition-[width] duration-700 ease-in-out overflow-hidden"
      :class="sidebarHovered ? 'w-[260px]' : 'w-[88px]'"
      @mouseenter="sidebarHovered = true"
      @mouseleave="sidebarHovered = false"
    >
      <SidebarNav
        :expanded="sidebarHovered"
        @action="handleAction"
        @navigate="onNavigate"
      />
    </aside>

    <!-- Zone principale -->
    <div class="flex-1 flex flex-col min-w-0">
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
