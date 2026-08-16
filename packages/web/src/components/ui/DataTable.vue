<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref } from 'vue';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next';

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

const props = withDefaults(
  defineProps<{
    columns: Column[];
    rows: T[];
    loading?: boolean;
    rowKey?: string;
    emptyText?: string;
    clickableRows?: boolean;
    selectable?: boolean;
    selected?: string[];
  }>(),
  { loading: false, rowKey: '_id', emptyText: 'Aucun résultat.', clickableRows: false, selectable: false, selected: () => [] }
);

const emit = defineEmits<{ 
  (e: 'row-click', row: T): void;
  (e: 'update:selected', value: string[]): void;
}>();

const sortKey = ref<string | null>(null);
const sortDir = ref<'asc' | 'desc'>('asc');

function toggleSort(col: Column) {
  if (!col.sortable) return;
  if (sortKey.value === col.key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = col.key;
    sortDir.value = 'asc';
  }
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows;
  const key = sortKey.value;
  const dir = sortDir.value === 'asc' ? 1 : -1;
  return [...props.rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv), 'fr', { numeric: true }) * dir;
  });
});

const alignClass = (a?: string) =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

const allSelected = computed(() => {
  return props.rows.length > 0 && props.selected.length === props.rows.length;
});

const someSelected = computed(() => {
  return props.selected.length > 0 && props.selected.length < props.rows.length;
});

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  if (checked) {
    emit('update:selected', props.rows.map(r => r[props.rowKey]));
  } else {
    emit('update:selected', []);
  }
}

function toggleRow(row: T) {
  const id = row[props.rowKey];
  const isSelected = props.selected.includes(id);
  if (isSelected) {
    emit('update:selected', props.selected.filter(x => x !== id));
  } else {
    emit('update:selected', [...props.selected, id]);
  }
}
</script>

<template>
  <div class="w-full overflow-x-auto rounded-xl border border-border/60 bg-card">
    <table class="w-full text-[13px] border-collapse">
      <thead>
        <tr class="border-b border-border/60">
          <th v-if="selectable" class="w-10 px-4 py-3 text-left">
            <input 
              type="checkbox" 
              class="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              :checked="allSelected"
              :indeterminate="someSelected"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 font-medium text-muted-foreground select-none"
            :class="[alignClass(col.align), col.sortable ? 'cursor-pointer hover:text-foreground transition-colors' : '']"
            :style="col.width ? { width: col.width } : undefined"
            @click="toggleSort(col)"
          >
            <slot :name="`head-${col.key}`" :col="col">
              <span class="inline-flex items-center gap-1" :class="col.align === 'right' ? 'flex-row-reverse' : ''">
                {{ col.label }}
                <template v-if="col.sortable">
                  <ChevronUp v-if="sortKey === col.key && sortDir === 'asc'" class="w-3.5 h-3.5" :stroke-width="2" />
                  <ChevronDown v-else-if="sortKey === col.key && sortDir === 'desc'" class="w-3.5 h-3.5" :stroke-width="2" />
                  <ChevronsUpDown v-else class="w-3.5 h-3.5 text-muted-foreground/40" :stroke-width="2" />
                </template>
              </span>
            </slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Chargement -->
        <tr v-if="loading">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-4 py-12 text-center text-muted-foreground">
            Chargement…
          </td>
        </tr>
        <!-- Vide -->
        <tr v-else-if="!sortedRows.length">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-4 py-12 text-center text-muted-foreground">
            {{ emptyText }}
          </td>
        </tr>
        <!-- Lignes -->
        <tr
          v-for="row in sortedRows"
          v-else
          :key="row[rowKey]"
          class="border-b border-border/40 last:border-0 transition-colors"
          :class="clickableRows ? 'cursor-pointer hover:bg-black/[0.03]' : ''"
          @click="clickableRows && emit('row-click', row)"
        >
          <td v-if="selectable" class="px-4 py-3" @click.stop>
            <input 
              type="checkbox" 
              class="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              :checked="selected.includes(row[rowKey])"
              @change="toggleRow(row)"
            />
          </td>
          <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-foreground/90" :class="alignClass(col.align)">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] ?? '—' }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
