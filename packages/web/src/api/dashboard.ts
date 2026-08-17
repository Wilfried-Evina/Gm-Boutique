import { apiClient } from './client';

export type DashboardPeriod = 'week' | 'month' | 'quarter' | 'year';

export interface DashboardStats {
  totalClients: number;
  articles: { onSale: number; sold: number; returned: number; deposited: number; total: number };
  sellRate: number;
  pendingRetroAmount: number;
  pendingRetroCount: number;
}

export interface CASeriesPoint {
  label: string;
  ca: number;
  retro: number;
  gains: number;
}

export interface CAResponse {
  period: DashboardPeriod;
  series: CASeriesPoint[];
  totals: {
    totalCA: number;
    totalRetrocessions: number;
    totalPaid: number;
    totalRemaining: number;
    storeEarnings: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get('/dashboard/stats');
  return data;
}

export async function getDashboardCA(period: DashboardPeriod): Promise<CAResponse> {
  const { data } = await apiClient.get('/dashboard/ca', { params: { period } });
  return data;
}
