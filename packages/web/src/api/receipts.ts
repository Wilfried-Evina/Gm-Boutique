import { apiClient } from './client';

export interface CreateReceiptDTO {
  clientId: string;
  type: 'deposit' | 'restitution';
  articleIds: string[];
  signatureData: string;
}

export interface IReceipt {
  _id: string;
  clientId: string;
  type: 'deposit' | 'restitution';
  articleIds: any[];
  signatureData: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export async function createReceipt(data: CreateReceiptDTO): Promise<IReceipt> {
  const response = await apiClient.post<IReceipt>('/receipts', data);
  return response.data;
}

export async function getClientReceipts(clientId: string): Promise<IReceipt[]> {
  const response = await apiClient.get<IReceipt[]>(`/receipts/client/${clientId}`);
  return response.data;
}
