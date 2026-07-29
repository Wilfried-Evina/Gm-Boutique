export interface IRetrocessionSummary {
  clientId: string;
  clientName: string;
  totalArticlesSold: number;
  totalAmountDue: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  status: 'pending' | 'paid';
}
