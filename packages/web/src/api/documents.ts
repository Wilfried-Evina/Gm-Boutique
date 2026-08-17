import { apiClient } from './client';

export interface IClientDocument {
  _id: string;
  clientId?: string;
  type: 'deposit' | 'retrocession' | 'client_profile' | 'sales_report' | 'other';
  fileUrl: string;
  referenceNumber: string;
  sentByEmail: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Liste les documents d'une cliente (triés du plus récent au plus ancien). */
export async function getClientDocuments(clientId: string): Promise<IClientDocument[]> {
  const { data } = await apiClient.get(`/documents/client/${clientId}`);
  return data;
}

/** Récupère un document en blob (auth via token) pour l'aperçu / téléchargement. */
export async function fetchDocumentBlob(documentId: string): Promise<Blob> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${apiClient.defaults.baseURL}/documents/${documentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erreur lors du téléchargement du document.');
  return res.blob();
}

/** Libellé lisible du type de document. */
export function documentTypeLabel(type: IClientDocument['type']): string {
  switch (type) {
    case 'deposit':
      return 'Fiche de dépôt';
    case 'retrocession':
      return 'Relevé de rétrocession';
    case 'client_profile':
      return 'Fiche cliente';
    case 'sales_report':
      return 'Rapport de ventes';
    default:
      return 'Document';
  }
}
