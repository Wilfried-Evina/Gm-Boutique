import mongoose, { Document, Schema } from 'mongoose';
import { IArticle, ArticleStatus, ActionOnExpiry } from '@gm-boutique/shared';

export interface IArticleDocument extends Omit<IArticle, '_id' | 'createdAt' | 'updatedAt' | 'clientId'>, Document {
  clientId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticleDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    barcode: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    type: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String },
    season: { type: String },
    description: { type: String },
    
    // Pricing
    clientPrice: { type: Number, required: true, min: 0 },
    publicPrice: { type: Number, required: true, min: 0 },
    finalSalePrice: { type: Number, min: 0 },
    finalClientAmount: { type: Number, min: 0 },
    
    priceReduction: {
      deadlineDate: { type: Date },
      reducedPublicPrice: { type: Number, min: 0 },
      reducedClientPrice: { type: Number, min: 0 },
      actionOnExpiry: { type: String, enum: Object.values(ActionOnExpiry) }
    },
    
    status: { type: String, enum: Object.values(ArticleStatus), default: ArticleStatus.DEPOSITED },
    retrocessionPaid: { type: Boolean, default: false },
    retrocessionPaidAt: { type: Date },
    retrocessionPaymentMethod: { type: String },
    retrocessionReference: { type: String },
    retrocessionReceiptId: { type: Schema.Types.ObjectId, ref: 'Document' },
  },
  { timestamps: true }
);

// Indexes
articleSchema.index({ barcode: 1 });
articleSchema.index({ clientId: 1 });
articleSchema.index({ status: 1 });

export const Article = mongoose.model<IArticleDocument>('Article', articleSchema);
