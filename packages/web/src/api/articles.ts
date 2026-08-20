import { apiClient } from './client';
import type { IArticle, PaginatedResponse, ArticleStatus } from '@gm-boutique/shared';

// Types pour la création
export interface CreateArticleDTO {
  clientId: string;
  brand: string;
  type: string;
  color: string;
  size?: string;
  season?: string;
  description?: string;
  clientPrice: number;
  publicPrice: number;
  priceReduction?: {
    deadlineDate: Date;
    reducedPublicPrice: number;
    reducedClientPrice: number;
    actionOnExpiry: 'reduce_price' | 'return_to_client';
  };
}

export const articlesApi = {
  // Liste paginée avec filtres
  getAll: async (params?: { page?: number; limit?: number; status?: string; clientId?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<IArticle>>('/articles', { params });
    return data;
  },

  // Créer un dépôt
  create: async (articleData: CreateArticleDTO) => {
    const { data } = await apiClient.post<IArticle>('/articles', articleData);
    return data;
  },

  // Suggestions pour les formulaires
  getSuggestions: async (field: 'brand' | 'type' | 'color', q: string) => {
    const { data } = await apiClient.get<string[]>('/articles/suggestions', { params: { field, q } });
    return data;
  },

  // Récupérer un article
  getById: async (id: string) => {
    const { data } = await apiClient.get<IArticle>(`/articles/${id}`);
    return data;
  },

  // Scan par code barre
  getByBarcode: async (barcode: string) => {
    const { data } = await apiClient.get<IArticle>(`/articles/scan/${barcode}`);
    return data;
  },

  // Modifier un article
  update: async (id: string, updates: Partial<CreateArticleDTO>) => {
    const { data } = await apiClient.put<IArticle>(`/articles/${id}`, updates);
    return data;
  },

  // Changer de statut
  updateStatus: async (id: string, status: ArticleStatus) => {
    const { data } = await apiClient.patch<IArticle>(`/articles/${id}/status`, { status });
    return data;
  },

  // Valider le prix de vente final
  validatePrice: async (id: string, finalPrices: { finalSalePrice: number; finalClientAmount: number }) => {
    const { data } = await apiClient.patch<IArticle>(`/articles/${id}/validate-price`, finalPrices);
    return data;
  },

  // Récupérer les articles expirés
  getExpired: async () => {
    const { data } = await apiClient.get<IArticle[]>('/articles/expired');
    return data;
  },

  // Alertes gérante : échéances dans le mois ou dépassées (issue #30)
  getAlerts: async () => {
    const { data } = await apiClient.get<IArticle[]>('/articles/alerts');
    return data;
  }
};
