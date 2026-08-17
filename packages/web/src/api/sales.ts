import { apiClient } from './client';
import type { ISale, CreateSaleDTO } from '@gm-boutique/shared';

export const salesApi = {
  checkout: async (data: CreateSaleDTO) => {
    const response = await apiClient.post<ISale>('/sales/checkout', data);
    return response.data;
  },
  createHistoricalFull: async (data: any) => {
    const response = await apiClient.post<ISale>('/sales/historical-full', data);
    return response.data;
  },
  getAll: async () => {
    const response = await apiClient.get<ISale[]>('/sales');
    return response.data;
  },
  generateSalesReport: async (startDate: Date, endDate: Date) => {
    const response = await apiClient.post('/documents/generate/sales-report', {
      startDate,
      endDate
    });
    return response.data;
  }
};
