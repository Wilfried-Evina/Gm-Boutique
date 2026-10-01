<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from '../ui/Modal.vue';
import { useNotificationsStore } from '../../stores/notifications';
import { Plus, Trash2, CalendarIcon } from 'lucide-vue-next';
import Autocomplete from '../ui/Autocomplete.vue';
import { apiClient } from '../../api/client';

const props = defineProps<{
  open: boolean;
  clientId: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

const notify = useNotificationsStore();
const loading = ref(false);

const depositDate = ref<string>('');

type ItemStatus = 'En boutique' | 'Payé' | 'Restitué';

interface DigitalArticle {
  id: number;
  brand: string;
  type: string;
  color: string;
  size: string;
  description: string;
  clientPrice: number | null;
  publicPrice: number | null;
  status: ItemStatus;
  actionDate?: string;
}

const articles = ref<DigitalArticle[]>([
  { id: 1, brand: '', type: '', color: '', size: '', description: '', clientPrice: null, publicPrice: null, status: 'En boutique' }
]);

let nextId = 2;

function addArticle() {
  articles.value.push({
    id: nextId++,
    brand: '',
    type: '',
    color: '',
    size: '',
    description: '',
    clientPrice: null,
    publicPrice: null,
    status: 'En boutique'
  });
}

function removeArticle(id: number) {
  if (articles.value.length === 1) return;
  articles.value = articles.value.filter(a => a.id !== id);
}

const isFormValid = computed(() => {
  if (!depositDate.value) return false;
  for (const a of articles.value) {
    if (!a.brand || !a.type || !a.color || !a.clientPrice || a.clientPrice <= 0 || !a.publicPrice || a.publicPrice <= 0) return false;
    if (a.status !== 'En boutique' && !a.actionDate) return false;
  }
  return true;
});

async function submit() {
  if (!isFormValid.value) return;
  
  loading.value = true;
  try {
    const payload = {
      depositDate: depositDate.value,
      articles: articles.value.map(a => ({
        brand: a.brand.trim(),
        type: a.type.trim(),
        color: a.color.trim(),
        size: a.size.trim(),
        description: a.description.trim(),
        clientPrice: a.clientPrice,
        publicPrice: a.publicPrice,
        status: a.status,
        actionDate: a.actionDate || null
      }))
    };

    await apiClient.post(`/digitalization/clients/${props.clientId}`, payload);
    notify.success('Fiche historique digitalisée avec succès.');
    emit('success');
    emit('update:open', false);
    
    // Reset form for next time
    depositDate.value = '';
    articles.value = [{ id: nextId++, brand: '', type: '', color: '', size: '', description: '', clientPrice: null, publicPrice: null, status: 'En boutique' }];
  } catch (error: any) {
    console.error(error);
    notify.error("Erreur lors de la digitalisation de la fiche.");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal :open="open" title="Digitaliser une ancienne fiche" @update:open="emit('update:open', $event)">
    <div class="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
      <!-- Date de dépôt -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CalendarIcon class="w-4 h-4" /> Date du dépôt original sur la fiche
        </label>
        <input 
          type="date" 
          v-model="depositDate"
          class="h-10 px-3 bg-card border border-border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-foreground/20"
        />
      </div>

      <!-- Articles -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <label class="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Articles déposés</label>
          <button @click="addArticle" type="button" class="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded hover:bg-primary/20 flex items-center gap-1 transition-colors">
            <Plus class="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <div v-for="(article, index) in articles" :key="article.id" class="p-4 bg-muted/30 border border-border rounded-lg relative flex flex-col gap-3">
            <button v-if="articles.length > 1" @click="removeArticle(article.id)" type="button" class="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded transition-colors">
              <Trash2 class="w-4 h-4" />
            </button>
            <div class="font-medium text-sm text-foreground mb-1">Article {{ index + 1 }}</div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5 col-span-1">
                <Autocomplete v-model="article.color" label="Couleur" placeholder="Ex: Noir" field="color" />
              </div>
              <div class="flex flex-col gap-1.5 col-span-1">
                <label class="text-[11px] text-muted-foreground">Taille</label>
                <input v-model="article.size" type="text" class="h-9 px-3 bg-card border border-border rounded-md text-[13px] outline-none focus:ring-1" placeholder="Ex: M ou 38" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5 col-span-1">
                <Autocomplete v-model="article.brand" label="Marque" placeholder="Ex: Zara" field="brand" />
              </div>
              <div class="flex flex-col gap-1.5 col-span-1">
                <Autocomplete v-model="article.type" label="Type" placeholder="Ex: Robe" field="type" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5 col-span-1">
                <label class="text-[11px] text-muted-foreground">Prix Boutique / Vente (CHF)</label>
                <input v-model="article.publicPrice" type="number" min="0" class="h-9 px-3 bg-card border border-border rounded-md text-[13px] outline-none focus:ring-1" placeholder="Ex: 100" />
              </div>
              <div class="flex flex-col gap-1.5 col-span-1">
                <label class="text-[11px] text-muted-foreground">Gain Client (CHF)</label>
                <input v-model="article.clientPrice" type="number" min="0" class="h-9 px-3 bg-card border border-border rounded-md text-[13px] outline-none focus:ring-1" placeholder="Ex: 50" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] text-muted-foreground">Description (Couleur, taille, détails...)</label>
              <input v-model="article.description" type="text" class="h-9 px-3 bg-card border border-border rounded-md text-[13px] outline-none focus:ring-1" placeholder="Ex: Bleu marine, taille M" />
            </div>

            <div class="grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-border/50">
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] text-muted-foreground">Statut actuel</label>
                <select v-model="article.status" class="h-9 px-3 bg-card border border-border rounded-md text-[13px] outline-none focus:ring-1">
                  <option value="En boutique">En boutique</option>
                  <option value="Payé">Vendu & Payé</option>
                  <option value="Restitué">Restitué</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5" v-if="article.status !== 'En boutique'">
                <label class="text-[11px] text-muted-foreground">
                  Date de {{ article.status === 'Restitué' ? 'restitution' : 'vente' }}
                </label>
                <input v-model="article.actionDate" type="date" class="h-9 px-3 bg-card border border-border rounded-md text-[13px] outline-none focus:ring-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-10 px-4 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-black/5 transition-colors"
        @click="emit('update:open', false)"
      >
        Annuler
      </button>
      <button
        @click="submit"
        :disabled="loading || !isFormValid"
        class="h-10 px-5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Digitalisation...' : 'Enregistrer la fiche' }}
      </button>
    </template>
  </Modal>
</template>
