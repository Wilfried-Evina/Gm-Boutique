import { apiClient } from './client';
import type { IRetrocessionSummary } from '@gm-boutique/shared';

export interface RetrocessionRow {
  clientId: string;
  clientName: string;
  referenceNumber: string;
  totalArticlesSold: number;
  totalRetrocessions: number;
  totalPaid: number;
  remainingToPay: number;
  status: 'pending' | 'paid';
}

/** Vue globale : synthèse de rétrocession par cliente. */
export async function getAllRetrocessions(): Promise<RetrocessionRow[]> {
  const { data } = await apiClient.get('/retrocessions');
  return data;
}

/** Marque un article vendu comme remboursé. Retourne le récap à jour. */
export async function markArticlePaid(articleId: string): Promise<IRetrocessionSummary> {
  // Corps {} explicite : garantit l'en-tête Content-Type (l'API refuse les POST sans JSON).
  const { data } = await apiClient.post(`/retrocessions/${articleId}/mark-paid`, {});
  return data;
}

/** Marque tous les articles vendus non payés d'une cliente comme remboursés. */
export async function markAllPaid(clientId: string): Promise<IRetrocessionSummary> {
  const { data } = await apiClient.post(`/retrocessions/client/${clientId}/mark-all-paid`, {});
  return data;
}
