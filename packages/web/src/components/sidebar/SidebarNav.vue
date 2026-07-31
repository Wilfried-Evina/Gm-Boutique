<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { navGroups, bottomItems, type NavItemData } from '../../config/navigation';
import NavItem from './NavItem.vue';
import { ChevronUp } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

defineProps<{ expanded?: boolean }>();

const emit = defineEmits<{
  (e: 'action', action: 'search' | 'logout'): void;
  (e: 'navigate'): void;
}>();

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
</script>

<template>
  <div class="flex flex-col h-full bg-white font-sans select-none overflow-x-hidden">

    <!-- ===== LOGO HEADER ===== -->
    <div class="h-[72px] shrink-0 flex items-center px-5 gap-3 w-[260px]">
      <img src="/logo.png" alt="GM Boutique" class="w-[48px] h-[48px] object-contain shrink-0" />
      <div 
        class="flex flex-col overflow-hidden whitespace-nowrap transition-opacity duration-700 ease-in-out pb-0.5"
        :class="expanded ? 'opacity-100' : 'opacity-0'"
      >
        <span class="text-[18px] font-bold tracking-tight text-gray-900 leading-none">GM Boutique</span>
      </div>
    </div>

    <!-- ===== NAVIGATION CONTENT ===== -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div class="flex flex-col pt-1 gap-4 px-5">
        <div v-for="(group, idx) in navGroups" :key="'g-' + idx" class="flex flex-col">

          <!-- Group heading (hidden if none) -->
          <div
            v-if="group.heading"
            class="flex items-center gap-3 py-3 mb-1 cursor-default transition-opacity duration-700 ease-in-out w-[220px]"
            :class="expanded ? 'opacity-100' : 'opacity-0'"
          >
            <component
              v-if="group.icon"
              :is="group.icon"
              class="w-[18px] h-[18px] shrink-0 text-emerald-700"
              :stroke-width="2"
            />
            <span class="text-[12px] font-bold tracking-[0.06em] uppercase text-emerald-700 flex-1 whitespace-nowrap">
              {{ group.heading }}
            </span>
          </div>

          <!-- Items -->
          <div class="flex flex-col gap-4">
            <NavItem
              v-for="item in group.items"
              :key="item.id"
              :item="item"
              :expanded="expanded"
              @action="$emit('action', $event)"
              @navigate="$emit('navigate')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ===== BOTTOM BAR ===== -->
    <div class="mt-auto border-t border-gray-100 overflow-x-hidden">
      <div class="flex flex-col gap-4 py-3 px-5">
        <NavItem
          v-for="item in bottomItems"
          :key="'b-' + item.id"
          :item="item"
          :expanded="expanded"
          @action="$emit('action', $event)"
          @navigate="$emit('navigate')"
        />
      </div>
    </div>

  </div>
</template>
