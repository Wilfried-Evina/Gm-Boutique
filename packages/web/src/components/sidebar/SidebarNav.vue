<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { navGroups, bottomItems } from '../../config/navigation';
import NavItem from './NavItem.vue';

defineEmits<{
  (e: 'action', action: 'search' | 'logout'): void;
  (e: 'navigate'): void;
}>();

const authStore = useAuthStore();
</script>

<template>
  <div class="flex flex-col w-[260px] h-full bg-card/50 p-3 font-sans">
    <!-- En-tête de marque -->
    <div class="flex items-center gap-3 px-2 py-2 mb-4 select-none">
      <div
        class="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-[13px] shadow-sm shrink-0"
      >
        GM
      </div>
      <div class="flex flex-col overflow-hidden">
        <span class="text-[13px] font-semibold leading-tight text-foreground truncate">GM Boutique</span>
        <span class="text-[11px] text-muted-foreground leading-tight">
          {{ authStore.user?.role === 'admin' ? 'Administration' : 'Espace Gérante' }}
        </span>
      </div>
    </div>

    <!-- Groupes de navigation -->
    <div class="flex-1 overflow-y-auto flex flex-col gap-4 mt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div v-for="(group, idx) in navGroups" :key="idx" class="flex flex-col gap-0.5">
        <span
          v-if="group.heading"
          class="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase"
        >
          {{ group.heading }}
        </span>
        <NavItem
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          @action="$emit('action', $event)"
          @navigate="$emit('navigate')"
        />
      </div>
    </div>

    <!-- Bas de menu -->
    <div class="mt-auto pt-4 border-t border-border/50 flex flex-col gap-0.5">
      <NavItem
        v-for="item in bottomItems"
        :key="item.id"
        :item="item"
        @action="$emit('action', $event)"
        @navigate="$emit('navigate')"
      />
    </div>
  </div>
</template>
