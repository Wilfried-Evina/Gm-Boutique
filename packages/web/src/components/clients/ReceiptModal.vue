<template>
  <Modal :open="open" title="Détails du Bon" @update:open="$emit('update:open', $event)">
    <!-- Modal UI -->
    <div v-if="receipt" class="space-y-6 receipt-modal-content">
      
      <!-- En-tête du Bon -->
      <div class="flex justify-between items-start border-b border-gray-200 pb-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900">
            Bon de {{ receipt.type === 'deposit' ? 'Dépôt' : 'Restitution' }}
          </h2>
          <p class="text-sm font-mono text-gray-500">{{ receipt.referenceNumber }}</p>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-900">{{ formatDate(receipt.createdAt) }}</p>
          <span class="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium" 
                :class="receipt.type === 'deposit' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'">
            {{ receipt.type === 'deposit' ? 'Dépôt' : 'Restitution' }}
          </span>
        </div>
      </div>

      <!-- Informations Déposante -->
      <div v-if="client" class="text-sm">
        <p><span class="font-semibold">Déposante :</span> {{ client.firstName }} {{ client.lastName }}</p>
        <p class="text-gray-600">{{ client.email || client.phone }}</p>
      </div>

      <!-- Liste des Articles -->
      <div>
        <h3 class="text-sm font-semibold mb-3">Articles concernés ({{ receipt.articleIds.length }})</h3>
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Code</th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Marque</th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Type</th>
                <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider text-xs">Valeur</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="article in receipt.articleIds" :key="article._id">
                <td class="px-4 py-2 whitespace-nowrap font-mono text-xs text-gray-900">{{ article.barcode }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-gray-900">{{ article.brand }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-gray-500">{{ article.type }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-right text-emerald-600 font-medium">{{ formatCHF(article.clientPrice) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Signature -->
      <div class="pt-4 border-t border-gray-200">
        <p class="text-sm font-semibold mb-2">Signature de la déposante</p>
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 inline-block">
          <img v-if="receipt.signatureData.startsWith('data:')" :src="receipt.signatureData" alt="Signature" class="h-24 object-contain mix-blend-multiply" />
          <p v-else class="text-sm text-gray-500 italic h-24 flex items-center">{{ receipt.signatureData }}</p>
        </div>
      </div>

    </div>
    
    <template #footer>
      <!-- Champ email si la cliente n'en a pas ou si l'utilisateur veut changer -->
      <div v-if="showEmailInput" class="flex items-center gap-2 w-full sm:w-auto">
        <input
          v-model="customEmail"
          type="email"
          placeholder="email@exemple.com"
          class="h-10 px-3 rounded-lg text-[13px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black w-full sm:w-56"
          @keydown.enter="sendByEmail"
          @keydown.escape="showEmailInput = false; customEmail = ''"
        />
        <button
          type="button"
          class="h-10 px-4 rounded-lg text-[13px] font-medium bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-2 flex-shrink-0"
          @click="sendByEmail"
          :disabled="isSendingEmail"
        >
          <svg v-if="isSendingEmail" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <Mail v-else class="w-4 h-4" />
          Envoyer
        </button>
      </div>
      <button
        type="button"
        class="h-10 px-5 rounded-lg text-[13px] font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
        @click="$emit('update:open', false)"
      >
        Fermer
      </button>
      <button
        type="button"
        class="h-10 px-5 rounded-lg text-[13px] font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
        @click="handleEmailClick"
        :disabled="isSendingEmail"
        :title="emailToUse ? `Envoyer à ${emailToUse}` : 'Saisir un email'"
      >
        <svg v-if="isSendingEmail" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <Mail v-else class="w-4 h-4" />
        {{ isSendingEmail ? 'Envoi...' : (emailToUse ? 'Envoyer par email' : 'Envoyer par email') }}
      </button>
      <button
        type="button"
        class="h-10 px-5 rounded-lg text-[13px] font-medium bg-black text-white hover:bg-gray-800 transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
        @click="printReceiptA4"
        :disabled="isGenerating"
      >
        <Printer class="w-4 h-4" />
        {{ isGenerating ? 'Génération...' : 'Imprimer (A4)' }}
      </button>
    </template>

  </Modal>

  <!-- Hidden thermal receipt layout for printing -->
  <div id="printable-thermal-receipt" class="hidden" v-if="receipt && client">
    <div class="thermal-header">
      <img src="/logo.png" style="width: 100%; max-width: 120px; margin: 0 auto 5px auto; display: block;" alt="GMBoutique" />
      <p>Bon de {{ receipt.type === 'deposit' ? 'Dépôt' : 'Restitution' }}</p>
      <p>Réf: {{ receipt.referenceNumber }}</p>
      <p>{{ formatDate(receipt.createdAt) }}</p>
    </div>
    <div class="thermal-divider">--------------------------------</div>
    <div class="thermal-client">
      <p>Déposante: {{ client.firstName }} {{ client.lastName }}</p>
    </div>
    <div class="thermal-divider">--------------------------------</div>
    <table class="thermal-table">
      <thead>
        <tr>
          <th style="text-align: left;">Article</th>
          <th style="text-align: right;">Valeur</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="article in receipt.articleIds" :key="article._id">
          <td>{{ article.brand }} - {{ article.type }}<br><small>{{ article.barcode }}</small></td>
          <td style="text-align: right;">{{ formatCHF(article.clientPrice) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="thermal-divider">--------------------------------</div>
    <p style="text-align: center;">Total articles: {{ receipt.articleIds.length }}</p>
    <div class="thermal-divider">--------------------------------</div>
    <div class="thermal-signature">
      <p>Signature de la déposante:</p>
      <img v-if="receipt.signatureData.startsWith('data:')" :src="receipt.signatureData" style="width: 100%; max-height: 100px; object-fit: contain;" />
      <p v-else style="font-size: 14px; font-style: italic; color: #666; text-align: center; margin-top: 20px;">{{ receipt.signatureData }}</p>
    </div>
    <div class="thermal-footer">
      <p>Merci de votre confiance !</p>
      <p style="margin-top: 10px; font-size: 10px;">. . . . . . . . . . . . . . . . . . .</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from '../ui/Modal.vue';
import { Printer, Mail } from 'lucide-vue-next';
import { formatDate, formatCHF } from '../../utils/format';
import type { IReceipt } from '../../api/receipts';
import type { IClient } from '@gm-boutique/shared';
import { apiClient } from '../../api/client';
import { useNotificationsStore } from '../../stores/notifications';

const props = defineProps<{
  open: boolean;
  receipt: IReceipt | null;
  client: IClient | null;
}>();

defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const notify = useNotificationsStore();
const isGenerating = ref(false);
const isSendingEmail = ref(false);
const showEmailInput = ref(false);
const customEmail = ref('');

const emailToUse = computed(() => {
  return props.client?.email || '';
});

async function printReceiptA4() {
  if (!props.receipt) return;
  if (isGenerating.value) return;
  
  isGenerating.value = true;
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${apiClient.defaults.baseURL}/receipts/${props.receipt._id}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error("Erreur génération PDF");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch (e) {
    notify.error("Erreur lors de la génération du bon.");
  } finally {
    isGenerating.value = false;
  }
}

async function sendByEmail() {
  if (!props.receipt) return;
  if (isSendingEmail.value) return;

  const targetEmail = customEmail.value.trim() || emailToUse.value;
  if (!targetEmail) {
    showEmailInput.value = true;
    notify.error("Veuillez saisir une adresse email.");
    return;
  }

  isSendingEmail.value = true;
  try {
    await apiClient.post(`/receipts/${props.receipt._id}/send-email`, {
      email: targetEmail || undefined
    });
    notify.success(`Bon envoyé par email à ${targetEmail} !`);
    showEmailInput.value = false;
    customEmail.value = '';
  } catch (e: any) {
    const msg = e?.response?.data?.message || "Erreur lors de l'envoi de l'email.";
    notify.error(msg);
  } finally {
    isSendingEmail.value = false;
  }
}

function handleEmailClick() {
  if (emailToUse.value && !showEmailInput.value) {
    // Cliente a un email → envoie directement
    sendByEmail();
  } else {
    // Pas d'email → affiche le champ
    showEmailInput.value = true;
  }
}
</script>


<style>
@media print {
  /* Hide all elements globally */
  body * {
    visibility: hidden;
  }
  
  /* Show only the thermal receipt and its children */
  #printable-thermal-receipt,
  #printable-thermal-receipt * {
    visibility: visible;
  }
  
  /* Position the receipt at the top left of the page */
  #printable-thermal-receipt {
    display: block !important;
    position: fixed;
    left: 0;
    top: 0;
    width: 80mm; /* Standard thermal printer width */
    margin: 0;
    padding: 0; /* Let the printer handle margins, or add small padding */
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: black;
    background: white;
  }

  .thermal-header, .thermal-footer {
    text-align: center;
    margin-bottom: 10px;
  }

  .thermal-header h1 {
    font-size: 18px;
    margin: 0 0 5px 0;
  }

  .thermal-header p, .thermal-footer p {
    margin: 2px 0;
    font-size: 12px;
  }

  .thermal-divider {
    text-align: center;
    margin: 5px 0;
    font-size: 12px;
  }

  .thermal-client p {
    margin: 2px 0;
  }

  .thermal-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 5px;
  }

  .thermal-table th, .thermal-table td {
    padding: 2px 0;
    vertical-align: top;
  }

  .thermal-signature p {
    margin-bottom: 5px;
    text-align: center;
  }

  @page {
    margin: 0;
    size: 80mm auto; /* Set page size for the printer */
  }
}
</style>
