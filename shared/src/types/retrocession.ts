export interface IRetrocessionItem {
  articleId: string;
  barcode: string;
  brand: string;
  type: string;
  saleDate?: string | Date;
  finalSalePrice: number; // prix de vente effectif
  finalClientAmount: number; // montant net dû à la cliente
  retrocessionPaid: boolean;
  retrocessionPaidAt?: string | Date;
}

export interface IRetrocessionSummary {
  clientId: string;
  clientName: string;

  // Calculs (voir issue #24)
  totalSales: number; // Chiffre d'affaires = Σ finalSalePrice (articles vendus)
  totalRetrocessions: number; // Σ finalClientAmount (articles vendus)
  totalPaid: number; // montant déjà remboursé
  remainingToPay: number; // Total rétrocessions - déjà remboursé
  storeEarnings: number; // Gains commerce = CA - Total rétrocessions
  totalArticlesSold: number;

  // Détail par article
  items: IRetrocessionItem[];

  // Compatibilité / affichage
  totalAmountDue: number; // = remainingToPay
  status: 'pending' | 'paid';
}
