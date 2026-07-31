<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import type { NavItemData } from '../../config/navigation';

const props = withDefaults(
  defineProps<{
    item: NavItemData;
    level?: number;
    expanded?: boolean;
  }>(),
  { level: 0, expanded: true }
);

const emit = defineEmits<{
  (e: 'action', action: 'search' | 'logout'): void;
  (e: 'navigate'): void;
}>();

const route = useRoute();
const router = useRouter();

const hasChildren = computed(() => !!props.item.children?.length);

function parseTo(to?: string) {
  if (!to) return null;
  const [path, qs] = to.split('?');
  const query: Record<string, string> = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => (query[k] = v));
  return { path, query };
}

function matchesLeaf(item: NavItemData): boolean {
  const target = parseTo(item.to);
  if (!target) return false;
  if (route.path !== target.path) return false;
  
  const targetKeys = Object.keys(target.query);
  
  // Si le lien n'a pas de paramètres (ex: '/articles'), il ne doit être actif 
  // que s'il n'y a pas de filtre spécifique dans l'URL actuel (status ou filter).
  if (targetKeys.length === 0) {
    if (route.query.status || route.query.filter) {
      return false;
    }
    return true;
  }
  
  return targetKeys.every((k) => route.query[k] === target.query[k]);
}

const isActive = computed(() => {
  const target = parseTo(props.item.to);
  if (!target) return false;
  if (hasChildren.value) {
    // Le parent n'est actif que sur sa page « racine », sans filtre.
    return route.path === target.path && Object.keys(route.query).length === 0;
  }
  return matchesLeaf(props.item);
});

const hasActiveChild = computed(
  () => hasChildren.value && props.item.children!.some((c) => matchesLeaf(c))
);

const isOpen = ref(hasActiveChild.value);
watch(hasActiveChild, (v) => {
  if (v) isOpen.value = true;
});

function handleClick() {
  if (props.item.action) {
    emit('action', props.item.action);
    return;
  }
  if (hasChildren.value) {
    isOpen.value = !isOpen.value;
    return;
  }
  if (props.item.to) {
    router.push(props.item.to);
    emit('navigate');
  }
}
</script>

<template>
  <div class="flex flex-col w-full overflow-hidden">
    <div
      class="group h-[48px] flex items-center cursor-pointer transition-all duration-700 ease-in-out select-none relative"
      :class="[
        expanded ? 'w-[220px] rounded-md' : 'w-[48px] rounded-lg',
        isActive
          ? 'bg-emerald-50/80 text-gray-900 font-semibold'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-normal'
      ]"
      :style="{ paddingLeft: expanded ? `${level * 16}px` : '0px' }"
      @click="handleClick"
    >
      <div v-if="isActive" class="absolute left-0 top-1 bottom-1 w-[4px] bg-emerald-600 rounded-r-full"></div>

      <div class="flex items-center w-full">
        <div class="pl-3 shrink-0">
          <component
            :is="item.icon"
            class="w-[24px] h-[24px] transition-colors duration-700 ease-in-out"
            :class="isActive ? 'text-emerald-700' : 'text-gray-400 group-hover:text-gray-600'"
            :stroke-width="isActive ? 2 : 1.5"
          />
        </div>

        <div 
          class="flex items-center gap-3.5 pl-3.5 flex-1 min-w-0 transition-opacity duration-700 ease-in-out"
          :class="expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        >
          <span class="text-[16px] truncate">{{ item.title }}</span>

          <div class="flex items-center gap-2 shrink-0 ml-auto pr-3">
            <kbd
              v-if="item.shortcut"
              class="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded"
            >
              {{ item.shortcut }}
            </kbd>
            <span
              v-if="item.badge"
              class="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-600"
            >
              {{ item.badge }}
            </span>
            <ChevronRight
              v-if="hasChildren"
              class="w-4 h-4 text-gray-400 transition-transform duration-700 ease-in-out"
              :class="{ 'rotate-90': isOpen }"
              :stroke-width="2"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="hasChildren"
      class="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
      :class="isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
        <div
          class="absolute top-0 bottom-0 border-l border-gray-100"
          :style="{ left: `${level * 16 + 25}px` }"
        />
        <NavItem
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :level="level + 1"
          @action="emit('action', $event)"
          @navigate="emit('navigate')"
        />
      </div>
    </div>
  </div>
</template>
