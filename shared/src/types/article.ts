import { ArticleStatus, ActionOnExpiry } from './enums';
import { IClient } from './client';

export interface IPriceReduction {
  deadlineDate: string | Date;
  reducedPublicPrice: number;
  reducedClientPrice: number;
  actionOnExpiry: ActionOnExpiry;
}

export interface IArticle {
  _id: string;
  clientId: string | IClient; // ID reference or populated Client
  barcode: string;
  brand: string;
  type: string;
  color: string;
  size?: string;
  season?: string;
  description?: string;
  
  // Pricing
  clientPrice: number; // Gain Net (interface cliente)
  publicPrice: number; // Prix Public (interface gérante)
  finalSalePrice?: number;
  finalClientAmount?: number;
  priceReduction?: IPriceReduction;
  
  // Status and Tracking
  status: ArticleStatus;
  retrocessionPaid: boolean;
  retrocessionPaidAt?: string | Date;
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateArticleDTO {
  clientId: string;
  brand: string;
  type: string;
  color: string;
  size?: string;
  season?: string;
  description?: string;
  clientPrice: number;
  publicPrice: number;
  priceReduction?: IPriceReduction;
}
