export type PaymentMethod = 'cash' | 'card' | 'twint';

export interface ISale {
  _id: string;
  reference: string;
  articles: string[]; // Array of Article IDs
  totalAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateSaleDTO {
  articles: string[];
  paymentMethod: PaymentMethod;
}

export interface CreateHistoricalGodModeDTO {
  date: string; // ISO date string
  paymentMethod: PaymentMethod;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  article: {
    brand: string;
    type: string;
    color: string;
    publicPrice: number;
    clientPrice: number;
  };
}
