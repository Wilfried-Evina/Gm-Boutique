<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CheckCircle2, CreditCard, Smartphone, Banknote, ShieldCheck, QrCode } from 'lucide-vue-next';
import Modal from '../ui/Modal.vue';
import QrSignatureModal from '../pos/QrSignatureModal.vue';
import { formatCHF, formatDate } from '../../utils/format';
import { useNotificationsStore } from '../../stores/notifications';
import { payRetrocessions, type RetrocessionPayResponse } from '../../api/retrocessions';
import type { RetrocessionPaymentMethod } from '@gm-boutique/shared';

const props = defineProps<{
  open: boolean;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    referenceNumber?: string;
    phone?: string;
    address?: string;
  } | null;
  articles: Array<{
    _id?: string;
    articleId?: string;
    barcode: string;
    brand: string;
    type: string;
    finalClientAmount?: number;
    clientPrice?: number;
    saleDate?: string | Date;
    updatedAt?: string | Date;
  }>;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'success', res: RetrocessionPayResponse): void;
}>();

const notify = useNotificationsStore();

const paymentMethod = ref<RetrocessionPaymentMethod>('bank_transfer');
const loading = ref(false);

// Gestion de la signature QR code pour les espèces
const qrModalOpen = ref(false);
const capturedSignature = ref<string | null>(null);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      paymentMethod.value = 'bank_transfer';
      capturedSignature.value = null;
      qrModalOpen.value = false;
    }
  }
);

const totalAmount = computed(() => {
  return props.articles.reduce((sum, a) => {
    const amount = a.finalClientAmount ?? a.clientPrice ?? 0;
    return sum + amount;
  }, 0);
});

function handleMainAction() {
  if (!props.client) return;
  if (!paymentMethod.value) {
    notify.error('Veuillez sélectionner un mode de paiement.');
    return;
  }

  // Si paiement en espèces et pas encore de signature : ouvrir le QR code
  if (paymentMethod.value === 'cash' && !capturedSignature.value) {
    qrModalOpen.value = true;
    return;
  }

  // Sinon, procéder au versement direct
  executePayment(capturedSignature.value || undefined);
}

function onQrSigned(payload: { signatureBase64: string }) {
  qrModalOpen.value = false;
  capturedSignature.value = payload.signatureBase64;
  notify.success('Signature de la déposante reçue !');
  executePayment(payload.signatureBase64);
}

async function executePayment(sigBase64?: string) {
  if (!props.client) return;

  const articleIds = props.articles
    .map((a) => a.articleId || a._id)
    .filter((id): id is string => Boolean(id));

  if (articleIds.length === 0) {
    notify.error('Aucun article à régler.');
    return;
  }

  loading.value = true;
  try {
    const res = await payRetrocessions({
      clientId: props.client._id,
      articleIds,
      paymentMethod: paymentMethod.value,
      signatureBase64: sigBase64,
    });

    notify.success(`Règlement de ${formatCHF(totalAmount.value)} enregistré pour ${props.client.firstName} ${props.client.lastName}.`);
    emit('update:open', false);
    emit('success', res);
  } catch (err: any) {
    console.error('Erreur règlement rétrocession:', err);
    notify.error(err.response?.data?.message || 'Erreur lors de l’enregistrement du règlement.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal :open="open" title="Règlement de rétrocession sécurisé" @update:open="emit('update:open', $event)">
    <div class="space-y-5">
      <!-- Récapitulatif Déposante -->
      <div v-if="client" class="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Déposante</p>
          <p class="text-base font-bold text-foreground mt-0.5">{{ client.firstName }} {{ client.lastName }}</p>
          <p class="text-xs text-muted-foreground font-mono mt-0.5">Réf : {{ client.referenceNumber || 'N/A' }} · Tél : {{ client.phone || 'Non renseigné' }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total à verser</p>
          <p class="text-2xl font-bold text-emerald-700 mt-0.5">{{ formatCHF(totalAmount) }}</p>
        </div>
      </div>

      <!-- Sélection du mode de paiement (Obligatoire) -->
      <div>
        <label class="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Mode de versement
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <!-- Virement bancaire -->
          <button
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center"
            :class="
              paymentMethod === 'bank_transfer'
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                : 'border-border/60 bg-card hover:bg-black/[0.02] text-foreground'
            "
            @click="paymentMethod = 'bank_transfer'"
          >
            <CreditCard class="w-5 h-5 mb-1.5" :class="paymentMethod === 'bank_transfer' ? 'text-emerald-700' : 'text-muted-foreground'" />
            <span class="text-xs font-semibold">Virement bancaire</span>
          </button>

          <!-- TWINT -->
          <button
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center"
            :class="
              paymentMethod === 'twint'
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                : 'border-border/60 bg-card hover:bg-black/[0.02] text-foreground'
            "
            @click="paymentMethod = 'twint'"
          >
            <Smartphone class="w-5 h-5 mb-1.5" :class="paymentMethod === 'twint' ? 'text-emerald-700' : 'text-muted-foreground'" />
            <span class="text-xs font-semibold">TWINT</span>
          </button>

          <!-- Espèces -->
          <button
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center relative"
            :class="
              paymentMethod === 'cash'
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                : 'border-border/60 bg-card hover:bg-black/[0.02] text-foreground'
            "
            @click="paymentMethod = 'cash'"
          >
            <Banknote class="w-5 h-5 mb-1.5" :class="paymentMethod === 'cash' ? 'text-emerald-700' : 'text-muted-foreground'" />
            <span class="text-xs font-semibold">Espèces</span>
            <span v-if="capturedSignature" class="absolute top-2 right-2 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">
              ✓ Signé
            </span>
          </button>
        </div>
      </div>

      <!-- Information spécifique Espèces & QR code -->
      <div v-if="paymentMethod === 'cash'" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <QrCode class="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-amber-900">Signature sur smartphone requise pour les espèces</p>
          <p class="text-amber-800/90 mt-0.5">
            Lors de la validation, un <strong>QR Code</strong> sera présenté à la déposante pour qu'elle appose sa signature sur son téléphone afin de certifier la réception du cash.
          </p>
        </div>
      </div>

      <!-- Tableau des articles soldés (STRICTEMENT SANS PRIX PUBLIC) -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <p class="text-xs font-semibold text-foreground uppercase tracking-wider">
            Articles réglés ({{ articles.length }})
          </p>
          <span class="text-[11px] text-muted-foreground">Gains nets déposante</span>
        </div>

        <div class="border border-border/60 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-black/5 text-muted-foreground font-semibold border-b border-border/50 sticky top-0">
              <tr>
                <th class="py-2 px-3">Article</th>
                <th class="py-2 px-3">Code</th>
                <th class="py-2 px-3">Vendu le</th>
                <th class="py-2 px-3 text-right">Gain Déposante</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/40">
              <tr v-for="(a, idx) in articles" :key="a.articleId || a._id || idx" class="hover:bg-black/[0.01]">
                <td class="py-2 px-3 font-medium text-foreground">{{ a.brand }} · {{ a.type }}</td>
                <td class="py-2 px-3 font-mono text-muted-foreground text-[11px]">{{ a.barcode }}</td>
                <td class="py-2 px-3 text-muted-foreground">{{ formatDate(a.saleDate || a.updatedAt) }}</td>
                <td class="py-2 px-3 text-right font-bold text-foreground">
                  {{ formatCHF(a.finalClientAmount ?? a.clientPrice ?? 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alerte de traçabilité -->
      <div class="flex items-start gap-2.5 p-3 rounded-xl bg-black/[0.02] border border-border/50 text-[12px] text-muted-foreground">
        <ShieldCheck class="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <p>
          Cette action enregistre définitivement le versement et génère une <strong>quittance officielle de rétrocession (PDF)</strong> archivée dans les documents de la déposante.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="w-full flex items-center justify-center gap-3">
        <button
          type="button"
          class="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-black/[0.03] transition-colors"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          Annuler
        </button>

        <!-- Bouton d'action principal -->
        <button
          type="button"
          class="h-9 px-4 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          :disabled="loading || articles.length === 0"
          @click="handleMainAction"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>{{ loading ? 'Enregistrement…' : `Régler · ${formatCHF(totalAmount)}` }}</span>
        </button>
      </div>
    </template>
  </Modal>

  <!-- Modale QR code pour signature déposante en espèces -->
  <QrSignatureModal
    :is-open="qrModalOpen"
    signature-type="retrocession"
    @close="qrModalOpen = false"
    @signed="onQrSigned"
  />
</template>
