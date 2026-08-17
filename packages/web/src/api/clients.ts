import { apiClient } from './client';
import type {
  IClient,
  IArticle,
  CreateClientDTO,
  UpdateClientDTO,
  PaginatedResponse,
  IRetrocessionSummary,
} from '@gm-boutique/shared';

export interface ListClientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listClients(
  params: ListClientsParams = {}
): Promise<PaginatedResponse<IClient>> {
  const { data } = await apiClient.get('/clients', { params });
  return data;
}

export async function getClient(id: string): Promise<IClient> {
  const { data } = await apiClient.get(`/clients/${id}`);
  return data;
}

export async function createClient(dto: CreateClientDTO): Promise<IClient> {
  const { data } = await apiClient.post('/clients', dto);
  return data;
}

export async function updateClient(id: string, dto: UpdateClientDTO): Promise<IClient> {
  const { data } = await apiClient.put(`/clients/${id}`, dto);
  return data;
}

export async function getClientArticles(id: string): Promise<IArticle[]> {
  const { data } = await apiClient.get(`/clients/${id}/articles`);
  return data;
}

export async function getClientRetrocessions(id: string): Promise<IRetrocessionSummary> {
  const { data } = await apiClient.get(`/clients/${id}/retrocessions`);
  return data;
}

export async function generateClientProfilePDF(clientId: string): Promise<{ _id: string, fileUrl: string, referenceNumber: string }> {
  const { data } = await apiClient.post(`/documents/generate/client-profile/${clientId}`, {});
  return data;
}
