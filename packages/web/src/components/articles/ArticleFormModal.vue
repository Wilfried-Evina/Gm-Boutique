<template>
  <Modal :open="isOpen" :title="articleToEdit ? `Modifier l'Article` : `Déposer un Article`" @update:open="closeModal">
    <form @submit.prevent="submit" class="space-y-6">
      
      <!-- Cliente (Disabled in edit mode to prevent changing owner) -->
      <div class="relative" ref="clientDropdownRef">
        <label class="block text-sm font-medium text-gray-700">Cliente déposante</label>
        
        <!-- Cliente sélectionnée -->
        <div v-if="selectedClient" class="mt-1 flex items-center justify-between w-full rounded-md border-gray-300 shadow-sm sm:text-sm h-10 px-3 border bg-gray-50">
          <span class="font-medium text-gray-900">{{ selectedClient.referenceNumber }} - {{ selectedClient.firstName }} {{ selectedClient.lastName }}</span>
          <button v-if="!articleToEdit" type="button" @click="clearClient" class="text-gray-400 hover:text-black focus:outline-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <!-- Recherche de cliente -->
        <div v-else class="mt-1 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
            type="text" 
            v-model="clientSearchQuery" 
            placeholder="Rechercher par nom, prénom ou réf..." 
            class="block w-full pl-9 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 border bg-white"
            @focus="isClientDropdownOpen = true"
          />
          <ul v-if="isClientDropdownOpen" class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-48 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-200">
            <li v-if="filteredClients.length === 0" class="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500">
              Aucune cliente trouvée.
            </li>
            <li v-for="client in filteredClients" :key="client._id" @click="selectClient(client)" class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 flex flex-col">
              <span class="block truncate font-medium text-gray-900">{{ client.firstName }} {{ client.lastName }}</span>
              <span class="block truncate text-xs text-gray-500">Réf: {{ client.referenceNumber }}</span>
            </li>
          </ul>
        </div>
        <p v-if="clients.length === 0" class="text-xs text-amber-600 mt-1">Aucune cliente disponible. Veuillez d'abord en créer une.</p>
      </div>

      <!-- Caractéristiques (avec autocomplétion dynamique) -->
      <div class="grid grid-cols-2 gap-4">
        <AutocompleteInput
          v-model="form.brand"
          label="Marque"
          placeholder="ex: Chanel"
          required
          :fetcher="searchBrands"
          :creator="createBrand"
        />
        <AutocompleteInput
          v-model="form.type"
          label="Type"
          placeholder="ex: Sac à main"
          required
          :fetcher="searchTypes"
          :creator="createType"
        />
        <AutocompleteInput
          v-model="form.color"
          label="Couleur"
          placeholder="ex: Noir"
          required
          :fetcher="searchColors"
          :creator="createColor"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700">Taille</label>
          <input type="text" v-model="form.size" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border" placeholder="ex: M ou 38" />
        </div>
      </div>

      <!-- Prix -->
      <div class="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Tarification Initiale</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Gain Cliente (Prix Cliente)</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input type="number" step="0.01" min="0" v-model="form.clientPrice" required class="focus:ring-black focus:border-black block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md h-10 border" placeholder="0.00" />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">CHF</span>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Prix Boutique (Prix Public)</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input type="number" step="0.01" min="0" v-model="form.publicPrice" required class="focus:ring-black focus:border-black block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md h-10 border" placeholder="0.00" />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">CHF</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Option de Dégressivité -->
      <div>
        <div class="flex items-center mb-4">
          <input id="enable-reduction" type="checkbox" v-model="hasReduction" class="h-4 w-4 text-black focus:ring-black border-gray-300 rounded">
          <label for="enable-reduction" class="ml-2 block text-sm font-medium text-gray-700">
            Configurer une dégressivité ou restitution (Date butoir)
          </label>
        </div>

        <div v-if="hasReduction" class="bg-white p-4 rounded-md border border-gray-200 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Date butoir</label>
            <input type="date" v-model="form.priceReduction.deadlineDate" :required="hasReduction" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Action à l'expiration</label>
            <div class="flex space-x-4">
              <label class="inline-flex items-center">
                <input type="radio" v-model="form.priceReduction.actionOnExpiry" value="reduce_price" class="text-black focus:ring-black border-gray-300" name="action_type">
                <span class="ml-2 text-sm text-gray-700">Baisser les prix</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="form.priceReduction.actionOnExpiry" value="return_to_client" class="text-black focus:ring-black border-gray-300" name="action_type">
                <span class="ml-2 text-sm text-gray-700">Restituer à la cliente</span>
              </label>
            </div>
          </div>

          <div v-if="form.priceReduction.actionOnExpiry === 'reduce_price'" class="grid grid-cols-2 gap-4">
             <div>
              <label class="block text-sm font-medium text-gray-700">Nouveau Gain Cliente</label>
              <input type="number" step="0.01" min="0" v-model="form.priceReduction.reducedClientPrice" :required="form.priceReduction.actionOnExpiry === 'reduce_price'" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Nouveau Prix Boutique</label>
              <input type="number" step="0.01" min="0" v-model="form.priceReduction.reducedPublicPrice" :required="form.priceReduction.actionOnExpiry === 'reduce_price'" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm h-10 px-3 border" />
            </div>
          </div>
        </div>
      </div>

      <!-- Consentement CGU (obligatoire pour un nouveau dépôt) -->
      <div v-if="!articleToEdit" class="bg-gray-50 border border-gray-200 rounded-md p-4">
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            v-model="cguAccepted"
            class="mt-0.5 h-4 w-4 text-black focus:ring-black border-gray-300 rounded shrink-0"
          />
          <span class="text-sm text-gray-700 leading-snug">
            Je certifie que la cliente est l'unique <strong>propriétaire des articles déposés</strong>
            et j'accepte, en son nom, les
            <button
              type="button"
              @click="cguModalOpen = true"
              class="text-black underline underline-offset-2 hover:text-gray-600 font-medium"
            >
              Conditions Générales de GM Boutique</button>.
            <button
              type="button"
              @click="cguModalOpen = true"
              class="ml-1 text-gray-500 hover:text-black underline-offset-2 hover:underline"
            >
              (Lire les CGU)
            </button>
          </span>
        </label>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          @click="closeModal"
          class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="isSubmitting || (!articleToEdit && !cguAccepted)"
          class="bg-black border border-transparent text-white hover:bg-gray-800 px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer le Dépôt' }}
        </button>
      </div>
    </form>

    <!-- Modale d'affichage des CGU -->
    <CguModal v-model:open="cguModalOpen" show-accept @accept="cguAccepted = true" />
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue';
import Modal from '../ui/Modal.vue';
import CguModal from '../CguModal.vue';
import AutocompleteInput from '../ui/AutocompleteInput.vue';
import { useArticleStore } from '../../stores/articles';
import { listClients, updateClient } from '../../api/clients'; // On utilise l'api cliente créée par Arthur
import {
  searchBrands,
  createBrand,
  searchColors,
  createColor,
  searchTypes,
  createType,
} from '../../api/catalog';
import type { CreateArticleDTO } from '../../api/articles';

const props = defineProps<{
  isOpen: boolean;
  articleToEdit?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

const articleStore = useArticleStore();
const isSubmitting = ref(false);
const clients = ref<any[]>([]);
const hasReduction = ref(false);

// Consentement CGU (obligatoire pour un nouveau dépôt)
const cguAccepted = ref(false);
const cguModalOpen = ref(false);

// Logique pour le dropdown de recherche client
const clientSearchQuery = ref('');
const isClientDropdownOpen = ref(false);
const clientDropdownRef = ref<HTMLElement | null>(null);

const filteredClients = computed(() => {
  if (!clientSearchQuery.value) return clients.value;
  const q = clientSearchQuery.value.toLowerCase();
  return clients.value.filter(c => 
    c.firstName.toLowerCase().includes(q) || 
    c.lastName.toLowerCase().includes(q) || 
    c.referenceNumber.toLowerCase().includes(q)
  );
});

const selectedClient = computed(() => {
  return clients.value.find(c => c._id === form.clientId) || null;
});

const selectClient = (client: any) => {
  form.clientId = client._id;
  clientSearchQuery.value = '';
  isClientDropdownOpen.value = false;
};

const clearClient = () => {
  form.clientId = '';
  isClientDropdownOpen.value = false;
};

// Fermer le dropdown en cliquant à l'extérieur
const onClickOutside = (event: MouseEvent) => {
  if (clientDropdownRef.value && !clientDropdownRef.value.contains(event.target as Node)) {
    isClientDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});

const initialForm = (): CreateArticleDTO => ({
  clientId: '',
  brand: '',
  type: '',
  color: '',
  size: '',
  season: '',
  description: '',
  clientPrice: 0,
  publicPrice: 0,
  priceReduction: {
    deadlineDate: new Date(),
    actionOnExpiry: 'reduce_price',
    reducedPublicPrice: 0,
    reducedClientPrice: 0,
  }
});

const form = reactive<CreateArticleDTO>(initialForm());

onMounted(async () => {
  try {
    // Charger la liste des clientes pour le select (sans pagination pour la démo, limit 100)
    const response = await listClients({ limit: 100 });
    clients.value = response.data;
  } catch (err) {
    console.error(err);
  }
});

const resetForm = () => {
  Object.assign(form, initialForm());
  hasReduction.value = false;
  cguAccepted.value = false;
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.articleToEdit) {
      // Populating the form with existing article data
      form.clientId = props.articleToEdit.clientId._id || props.articleToEdit.clientId;
      form.brand = props.articleToEdit.brand;
      form.type = props.articleToEdit.type;
      form.color = props.articleToEdit.color;
      form.size = props.articleToEdit.size || '';
      form.season = props.articleToEdit.season || '';
      form.description = props.articleToEdit.description || '';
      form.clientPrice = props.articleToEdit.clientPrice;
      form.publicPrice = props.articleToEdit.publicPrice;
      
      if (props.articleToEdit.priceReduction) {
        hasReduction.value = true;
        form.priceReduction = {
          deadlineDate: new Date(props.articleToEdit.priceReduction.deadlineDate).toISOString().split('T')[0] as any,
          actionOnExpiry: props.articleToEdit.priceReduction.actionOnExpiry,
          reducedPublicPrice: props.articleToEdit.priceReduction.reducedPublicPrice,
          reducedClientPrice: props.articleToEdit.priceReduction.reducedClientPrice,
        };
      } else {
        hasReduction.value = false;
        form.priceReduction = initialForm().priceReduction;
      }
    } else {
      resetForm();
    }
  }
});

const closeModal = () => {
  resetForm();
  emit('close');
};

const submit = async () => {
  if (!form.clientId) {
    alert("Veuillez sélectionner une cliente déposante.");
    return;
  }

  // Consentement CGU obligatoire pour un nouveau dépôt (filet de sécurité,
  // le bouton est déjà désactivé tant que la case n'est pas cochée).
  if (!props.articleToEdit && !cguAccepted.value) {
    alert("Vous devez accepter les Conditions Générales pour enregistrer le dépôt.");
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = { ...form };

    // Si pas de réduction, on efface l'objet priceReduction
    if (!hasReduction.value) {
      delete payload.priceReduction;
    } else {
      // Si on choisit 'return_to_client', les prix réduits ne sont pas utiles
      if (payload.priceReduction?.actionOnExpiry === 'return_to_client') {
        payload.priceReduction.reducedPublicPrice = 0;
        payload.priceReduction.reducedClientPrice = 0;
      }
    }

    if (props.articleToEdit) {
      await articleStore.updateArticle(props.articleToEdit._id, payload);
    } else {
      // Enregistre l'acceptation des CGU sur la cliente (date horodatée côté
      // backend) AVANT le dépôt : requis pour que le backend autorise la création.
      if (!selectedClient.value?.cguAccepted) {
        await updateClient(form.clientId, { cguAccepted: true });
      }
      await articleStore.createArticle(payload);
    }

    emit('saved');
    closeModal();
  } catch (error) {
    console.error(error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
