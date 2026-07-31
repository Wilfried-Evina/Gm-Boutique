import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IArticle, PaymentMethod } from '@gm-boutique/shared';
import { articlesApi } from '../api/articles';
import { salesApi } from '../api/sales';
import { useNotificationsStore } from './notifications';

export const usePosStore = defineStore('pos', () => {
  const cart = ref<IArticle[]>([]);
  const isProcessing = ref(false);
  const notificationStore = useNotificationsStore();

  const totalAmount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.publicPrice, 0);
  });

  const cartItemIds = computed(() => {
    return cart.value.map(item => item._id);
  });

  const addByBarcode = async (barcode: string) => {
    if (!barcode) return;
    
    // Check if already in cart
    if (cart.value.some(item => item.barcode === barcode)) {
      notificationStore.warning('Cet article est déjà dans le panier');
      return;
    }

    isProcessing.value = true;
    try {
      const article = await articlesApi.getByBarcode(barcode);
      if (article.status !== 'on_sale') {
        notificationStore.error(`L'article n'est pas en vente`);
        return;
      }

      // Vérification de la dégressivité
      if (article.priceReduction && new Date(article.priceReduction.deadlineDate) < new Date()) {
        if (article.priceReduction.actionOnExpiry === 'return_to_client') {
          notificationStore.error('Date butoir dépassée. Cet article doit être restitué à la cliente !');
          return;
        } else if (article.priceReduction.actionOnExpiry === 'reduce_price') {
          article.publicPrice = article.priceReduction.reducedPublicPrice;
          article.clientPrice = article.priceReduction.reducedClientPrice;
          article.isReduced = true;
          notificationStore.info('Le prix dégressif a été appliqué');
        }
      }

      cart.value.push(article);
    } catch (err: any) {
      notificationStore.error(err.response?.data?.message || 'Article introuvable');
    } finally {
      isProcessing.value = false;
    }
  };

  const removeFromCart = (id: string) => {
    cart.value = cart.value.filter(item => item._id !== id);
  };

  const clearCart = () => {
    cart.value = [];
  };

  const checkout = async (paymentMethod: PaymentMethod) => {
    if (cart.value.length === 0) {
      notificationStore.error('Le panier est vide');
      return null;
    }

    isProcessing.value = true;
    try {
      const sale = await salesApi.checkout({
        articles: cartItemIds.value,
        paymentMethod
      });
      notificationStore.success('Encaissement réussi');
      clearCart();
      return sale;
    } catch (err: any) {
      notificationStore.error(err.response?.data?.message || 'Erreur lors de l\'encaissement');
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    cart,
    totalAmount,
    isProcessing,
    addByBarcode,
    removeFromCart,
    clearCart,
    checkout
  };
});
