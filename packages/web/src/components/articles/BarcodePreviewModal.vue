<template>
  <Teleport to="body">
    <Transition name="gm-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div class="absolute inset-0" @click="$emit('close')"></div>
        
        <!-- Ticket Container -->
        <div class="relative w-full max-w-[340px] bg-white text-gray-900 rounded-[24px] shadow-2xl flex flex-col items-center px-8 py-10 z-10" style="mask-image: radial-gradient(circle at 0 50%, transparent 16px, black 17px), radial-gradient(circle at 100% 50%, transparent 16px, black 17px); mask-size: 51% 100%; mask-repeat: no-repeat; mask-position: left, right; -webkit-mask-image: radial-gradient(circle at 0 50%, transparent 16px, black 17px), radial-gradient(circle at 100% 50%, transparent 16px, black 17px); -webkit-mask-size: 51% 100%; -webkit-mask-repeat: no-repeat; -webkit-mask-position: left, right;">
          
          <!-- Success Icon & Title -->
          <div class="flex flex-col items-center mb-6">
            <div class="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4 text-black">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-semibold text-black mb-1 tracking-tight">C'est prêt !</h2>
            <p class="text-sm text-gray-500 text-center">L'étiquette a été générée</p>
          </div>

          <!-- Divider -->
          <div class="border-t border-dashed border-gray-300 w-full mb-6 relative"></div>

          <!-- Details Row 1 -->
          <div class="flex justify-between items-start w-full mb-4">
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1">Réf. Article</span>
              <span class="text-sm font-mono text-black">{{ barcode || '---' }}</span>
            </div>
            <div class="flex flex-col text-right">
              <span class="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1">Prix</span>
              <span class="text-base font-semibold text-black">{{ typeof article?.publicPrice === 'number' ? article.publicPrice.toFixed(2) + ' CHF' : '---' }}</span>
            </div>
          </div>

          <!-- Details Row 2 -->
          <div class="flex justify-between items-start w-full mb-6">
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1">Marque & Type</span>
              <span class="text-sm font-medium text-black">{{ article?.brand || '---' }} <span class="text-gray-500 font-normal">({{ article?.type || '---' }})</span></span>
            </div>
            <div class="flex flex-col text-right">
              <span class="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1">Couleur</span>
              <span class="text-sm font-medium text-black">{{ article?.color || '---' }}</span>
            </div>
          </div>

          <!-- Details Row 3 -->
          <div class="flex flex-col w-full mb-6">
            <span class="text-[10px] text-gray-500 font-medium tracking-widest uppercase mb-1">Déposé le</span>
            <span class="text-sm font-medium text-black">{{ formatDate(article?.createdAt) }}</span>
          </div>

          <!-- Divider (Matches cutouts height loosely) -->
          <div class="border-t border-dashed border-gray-300 w-full mb-6"></div>

          <!-- Barcode -->
          <div class="flex flex-col items-center justify-center w-full mb-8 min-h-[60px]">
            <img v-if="imageUrl" :src="imageUrl" class="w-full max-w-[240px] mix-blend-multiply" alt="Code-barres" />
            <span v-else-if="isLoading" class="text-xs text-gray-400">Génération...</span>
            <span v-else class="text-xs text-red-500">Erreur de chargement</span>
          </div>
          
          <div class="flex w-full mt-2">
            <button @click="printBarcode" class="w-full py-3.5 rounded-xl bg-black text-white text-sm font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Imprimer l'étiquette
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { apiClient } from '../../api/client';

const props = defineProps<{
  isOpen: boolean;
  barcode: string | null;
  article?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const imageUrl = ref<string | null>(null);
const isLoading = ref(false);

const generateBarcode = async () => {
  if (props.article?._id) {
    isLoading.value = true;
    try {
      // Nous utilisons apiClient pour passer le token d'authentification
      const response = await apiClient.get(`/articles/${props.article._id}/barcode`, {
        responseType: 'blob'
      });
      // Libérer l'ancienne URL si elle existe
      if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value);
      }
      imageUrl.value = URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du code-barres:', error);
      imageUrl.value = null;
    } finally {
      isLoading.value = false;
    }
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    generateBarcode();
  } else {
    // Nettoyage à la fermeture
    if (imageUrl.value) {
      URL.revokeObjectURL(imageUrl.value);
      imageUrl.value = null;
    }
  }
});

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const printBarcode = () => {
  if (props.article && imageUrl.value) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const brand = props.article.brand || 'Marque inconnue';
    const typeAndColor = `${props.article.type || ''} - ${props.article.color || ''}`;
    
    let price = '';
    if (typeof props.article.publicPrice === 'number') {
      price = Number.isInteger(props.article.publicPrice) 
        ? `${props.article.publicPrice} CHF` 
        : `${props.article.publicPrice.toFixed(2)} CHF`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Impression Code-barres</title>
          <style>
            @page { size: 62mm 29mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { 
              margin: 0; 
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .label-page {
              width: 100%;
              height: 100vh; /* S'adapte exactement à la hauteur d'une page imprimable */
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 0;
              page-break-after: always;
              page-break-inside: avoid;
              overflow: hidden;
            }
            .brand { font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
            .details { font-size: 11px; color: #333; margin-bottom: 4px; }
            .price-only { font-size: 20px; font-weight: 900; }
            img.barcode-img { max-width: 90%; height: 16mm; object-fit: contain; }
          </style>
        </head>
        <body>
          <!-- Page 1 : Marque, Détails et Prix -->
          <div class="label-page">
            <div class="brand">${brand}</div>
            <div class="details">${typeAndColor}</div>
            <div class="price-only">${price}</div>
          </div>
          <!-- Page 2 : Code-barres uniquement -->
          <div class="label-page">
            <img src="${imageUrl.value}" class="barcode-img" alt="barcode" />
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300); // Petit délai pour s'assurer que le SVG est bien rendu
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
</script>
