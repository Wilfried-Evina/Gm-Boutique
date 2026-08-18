export type RetrocessionPaymentMethod = 'bank_transfer' | 'twint' | 'cash';

export interface IRetrocessionItem {
  articleId: string;
  barcode: string;
  brand: string;
  type: string;
  saleDate?: string | Date;
  finalSalePrice: number; // prix de vente effectif
  finalClientAmount: number; // montant net dû à la déposante
  retrocessionPaid: boolean;
  retrocessionPaidAt?: string | Date;
  retrocessionPaymentMethod?: RetrocessionPaymentMethod | string;
  retrocessionReference?: string;
  retrocessionReceiptId?: string;
}

export interface IRetrocessionSummary {
  clientId: string;
  clientName: string;

  // Calculs
  totalSales: number; // Chiffre d'affaires = Σ finalSalePrice (articles vendus)
  totalRetrocessions: number; // Σ finalClientAmount (total des gains des déposantes)
  totalPaid: number; // montant déjà versé
  remainingToPay: number; // Total rétrocessions - déjà versé
  storeEarnings: number; // Gains commerce = CA - Total rétrocessions
  totalArticlesSold: number;

  // Détail par article
  items: IRetrocessionItem[];

  // Compatibilité / affichage
  totalAmountDue: number; // = remainingToPay
  status: 'pending' | 'paid';
}

export interface IRetrocessionPayPayload {
  clientId: string;
  articleIds?: string[];
  paymentMethod: RetrocessionPaymentMethod;
  reference?: string;
  signatureBase64?: string;
}

export interface IRetrocessionGlobalStats {
  totalGlobalRetrocessions: number; // Total dû (cumulé)
  totalGlobalPaid: number;           // Déjà versé
  totalGlobalRemaining: number;      // Reste à verser
  clientsWithPendingCount: number;   // Nombre de déposantes en attente de versement
}
