<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import type { NavItemData } from '../../config/navigation';

const props = withDefaults(
  defineProps<{
    item: NavItemData;
    level?: number;
  }>(),
  { level: 0 }
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
  return Object.entries(target.query).every(([k, v]) => route.query[k] === v);
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
  <div class="flex flex-col w-full">
    <div
      class="group flex items-center justify-between px-2.5 py-[7px] rounded-md cursor-pointer transition-colors duration-200 select-none"
      :class="
        isActive
          ? 'bg-black/5 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-black/5 hover:text-foreground/90'
      "
      :style="{ paddingLeft: `${level * 12 + 10}px` }"
      @click="handleClick"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <component
          :is="item.icon"
          class="w-4 h-4 shrink-0 transition-colors"
          :class="isActive ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground/70'"
          :stroke-width="1.5"
        />
        <span class="text-[13px] tracking-wide truncate">{{ item.title }}</span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <kbd
          v-if="item.shortcut"
          class="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded"
        >
          {{ item.shortcut }}
        </kbd>
        <span
          v-if="item.badge"
          class="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary"
        >
          {{ item.badge }}
        </span>
        <ChevronRight
          v-if="hasChildren"
          class="w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200"
          :class="{ 'rotate-90': isOpen }"
          :stroke-width="2"
        />
      </div>
    </div>

    <div
      v-if="hasChildren"
      class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
        <div
          class="absolute top-0 bottom-0 border-l border-black/5"
          :style="{ left: `${level * 12 + 17.5}px` }"
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
