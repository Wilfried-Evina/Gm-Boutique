import { apiClient } from './client';
import type {
  IRetrocessionSummary,
  IRetrocessionPayPayload,
  IRetrocessionGlobalStats,
} from '@gm-boutique/shared';

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

export interface RetrocessionPayResponse {
  summary: IRetrocessionSummary;
  documentId: string;
  fileUrl: string;
  message: string;
}

/** Vue globale : synthèse de rétrocession par déposante. */
export async function getAllRetrocessions(): Promise<RetrocessionRow[]> {
  const { data } = await apiClient.get('/retrocessions');
  return data;
}

/** Statistiques globales pour les 4 cartes */
export async function getRetrocessionStats(): Promise<IRetrocessionGlobalStats> {
  const { data } = await apiClient.get('/retrocessions/stats');
  return data;
}

/** Récupère le détail des rétrocessions pour une déposante */
export async function getRetrocessionForClient(clientId: string): Promise<IRetrocessionSummary> {
  const { data } = await apiClient.get(`/retrocessions/client/${clientId}`);
  return data;
}

/** Règlement sécurisé avec mode de paiement et quittance PDF */
export async function payRetrocessions(payload: IRetrocessionPayPayload): Promise<RetrocessionPayResponse> {
  const { data } = await apiClient.post('/retrocessions/pay', payload);
  return data;
}

/** Marque un article vendu comme remboursé (secours). */
export async function markArticlePaid(articleId: string): Promise<IRetrocessionSummary> {
  const { data } = await apiClient.post(`/retrocessions/${articleId}/mark-paid`, {});
  return data;
}

/** Marque tous les articles vendus non payés d'une cliente comme remboursés (secours). */
export async function markAllPaid(clientId: string): Promise<IRetrocessionSummary> {
  const { data } = await apiClient.post(`/retrocessions/client/${clientId}/mark-all-paid`, {});
  return data;
}
