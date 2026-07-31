import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IArticle, ArticleStatus } from '@gm-boutique/shared';
import { articlesApi, type CreateArticleDTO } from '../api/articles';
import { useNotificationsStore } from './notifications';

export const useArticleStore = defineStore('articles', () => {
  const articles = ref<IArticle[]>([]);
  const totalArticles = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Pagination et filtres
  const currentPage = ref(1);
  const limit = ref(10);
  const currentStatusFilter = ref<string | undefined>(undefined);
  const currentClientFilter = ref<string | undefined>(undefined);

  const notificationStore = useNotificationsStore();

  const fetchArticles = async (page: number = 1) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await articlesApi.getAll({
        page,
        limit: limit.value,
        status: currentStatusFilter.value,
        clientId: currentClientFilter.value
      });
      articles.value = response.data;
      totalArticles.value = response.total;
      currentPage.value = page;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des articles';
      notificationStore.error(error.value!);
    } finally {
      isLoading.value = false;
    }
  };

  const setFilters = (status?: string, clientId?: string) => {
    currentStatusFilter.value = status;
    currentClientFilter.value = clientId;
    fetchArticles(1);
  };

  const createArticle = async (data: CreateArticleDTO) => {
    isLoading.value = true;
    try {
      const newArticle = await articlesApi.create(data);
      notificationStore.success('Article déposé avec succès !');
      await fetchArticles(currentPage.value);
      return newArticle;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors du dépôt';
      notificationStore.error(msg);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  const updateArticle = async (id: string, data: Partial<CreateArticleDTO>) => {
    isLoading.value = true;
    try {
      const updatedArticle = await articlesApi.update(id, data);
      notificationStore.success('Article modifié avec succès !');
      await fetchArticles(currentPage.value);
      return updatedArticle;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la modification';
      notificationStore.error(msg);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  const changeStatus = async (id: string, newStatus: ArticleStatus) => {
    isLoading.value = true;
    try {
      await articlesApi.updateStatus(id, newStatus);
      notificationStore.success('Statut mis à jour !');
      await fetchArticles(currentPage.value);
    } catch (err: any) {
      notificationStore.error('Erreur lors du changement de statut');
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    articles,
    totalArticles,
    isLoading,
    error,
    currentPage,
    limit,
    currentStatusFilter,
    currentClientFilter,
    fetchArticles,
    setFilters,
    createArticle,
    updateArticle,
    changeStatus
  };
});
