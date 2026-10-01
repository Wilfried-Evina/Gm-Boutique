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

          <!-- Divider -->
          <div class="border-t border-dashed border-gray-300 w-full mb-6"></div>

          <!-- Barcode preview (canvas) -->
          <div class="flex flex-col items-center justify-center w-full mb-8 min-h-[60px] bg-white p-2">
            <canvas ref="barcodeCanvasRef" class="w-full max-w-[240px]"></canvas>
            <span v-if="!barcode" class="text-xs text-red-500">Code-barres non disponible</span>
          </div>
          
          <div class="flex w-full mt-2">
            <button @click="printBarcode" :disabled="!barcodePngDataUrl" class="w-full py-3.5 rounded-xl bg-black text-white text-sm font-semibold shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50">
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
import { ref, watch, nextTick } from 'vue';
import JsBarcode from 'jsbarcode';

const props = defineProps<{
  isOpen: boolean;
  barcode: string | null;
  article?: any;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const barcodeCanvasRef = ref<HTMLCanvasElement | null>(null);
const barcodePngDataUrl = ref<string | null>(null);

/**
 * Génère le code-barres sur un canvas 300 DPI.
 *
 * Logique :
 *   - La QL-700 imprime à 300 DPI natif.
 *   - L'étiquette fait 49 mm de large × 62 mm de haut.
 *   - On réserve ~39 mm de large pour le code-barres (5 mm de marge de chaque côté).
 *   - On génère un canvas dont la taille physique correspond exactement à ces
 *     dimensions à 300 DPI, puis on l'affiche dans la page HTML d'impression
 *     en spécifiant ces mêmes dimensions en mm.
 *   - Résultat : l'imprimante imprime pixel-pour-pixel, SANS scaling, SANS flou.
 */
const generateBarcode300dpi = () => {
  if (!props.barcode) return;

  const DPI = 300;
  const MM_PER_INCH = 25.4;

  // Dimensions physiques de la zone barcode sur l'étiquette
  const barZoneWidthMm = 39;   // 49mm - 5mm marge × 2
  const barZoneHeightMm = 22;  // hauteur allouée au code-barres

  // Taille canvas en pixels (= DPI exact)
  const canvasW = Math.round((barZoneWidthMm / MM_PER_INCH) * DPI); // ≈ 461 px
  const canvasH = Math.round((barZoneHeightMm / MM_PER_INCH) * DPI); // ≈ 260 px

  // Quiet zone : 3 mm de chaque côté converti en pixels
  const quietZonePx = Math.round((3 / MM_PER_INCH) * DPI); // ≈ 35 px

  // Hauteur des barres = 75% de la hauteur canvas, le reste pour le texte
  const barHeightPx = Math.round(canvasH * 0.72);

  // Largeur minimale d'une barre : 2px pour éviter la fusion
  // (à 300 DPI, 2px = 0,17 mm — au-dessus du minimum Code128 de 0,19 mm → 3px)
  const moduleWidthPx = 3;

  // 1) Canvas pour l'impression (haute résolution)
  const printCanvas = document.createElement('canvas');
  printCanvas.width = canvasW;
  printCanvas.height = canvasH;

  JsBarcode(printCanvas, props.barcode, {
    format: 'CODE128',
    width: moduleWidthPx,
    height: barHeightPx,
    margin: quietZonePx,
    displayValue: false,
    background: '#ffffff',
    lineColor: '#000000',
  });

  barcodePngDataUrl.value = printCanvas.toDataURL('image/png');

  // 2) Canvas preview dans la modale (basse résolution, juste pour affichage)
  if (barcodeCanvasRef.value) {
    const previewCanvas = barcodeCanvasRef.value;
    JsBarcode(previewCanvas, props.barcode, {
      format: 'CODE128',
      width: 2,
      height: 50,
      margin: 8,
      displayValue: true,
      fontSize: 11,
      background: '#ffffff',
      lineColor: '#000000',
    });
  }
};

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await nextTick();
    generateBarcode300dpi();
  } else {
    barcodePngDataUrl.value = null;
  }
});

watch(() => props.barcode, async () => {
  if (props.isOpen) {
    await nextTick();
    generateBarcode300dpi();
  }
});

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const printBarcode = () => {
  if (!props.article || !props.barcode || !barcodePngDataUrl.value) return;

  const brand      = props.article.brand   || 'Marque inconnue';
  const typeColor  = `${props.article.type || ''} - ${props.article.color || ''}`;
  const price      = typeof props.article.publicPrice === 'number'
    ? (Number.isInteger(props.article.publicPrice)
        ? `${props.article.publicPrice} CHF`
        : `${props.article.publicPrice.toFixed(2)} CHF`)
    : '';

  // Dimensions physiques en mm (pour que le navigateur n'écale PAS l'image)
  const barZoneWidthMm  = 39;
  const barZoneHeightMm = 22;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Impression Code-barres</title>
    <style>
      @media print {
        @page {
          size: 49mm 62mm portrait;
          margin: 0 !important;
        }
        html, body {
          width: 49mm !important;
          height: 62mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: white;
        }
        header, footer, nav { display: none !important; }
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body { background: white; }

      .page {
        width: 49mm;
        height: 62mm;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 2mm 5mm 2mm 5mm;
      }

      .top {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8mm;
      }
      .brand {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .desc {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9px;
        text-align: center;
      }
      .price {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 16px;
        font-weight: 900;
      }

      .barcode-wrapper {
        width: ${barZoneWidthMm}mm;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /*
       * CRITIQUE : l'image est générée à 300 DPI et ses dimensions physiques
       * sont fixées ici en mm. Le navigateur N'A PAS besoin de la scaler →
       * chaque pixel du PNG correspond à un pixel imprimé sur la QL-700.
       */
      .barcode-wrapper img {
        display: block;
        width: ${barZoneWidthMm}mm;
        height: ${barZoneHeightMm}mm;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .ref {
        font-family: 'Courier New', Courier, monospace;
        font-size: 8px;
        text-align: center;
        margin-top: 0.5mm;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="top">
        <div class="brand">${brand}</div>
        <div class="desc">${typeColor}</div>
        <div class="price">${price}</div>
      </div>
      <div class="barcode-wrapper">
        <img src="${barcodePngDataUrl.value}" alt="Code-barres" />
        <div class="ref">${props.barcode}</div>
      </div>
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
          window.close();
        }, 400);
      };
    <\/script>
  </body>
</html>`);
  printWindow.document.close();
};
</script>
