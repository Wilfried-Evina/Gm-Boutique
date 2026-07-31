import mongoose, { Document, Schema } from 'mongoose';
import { ISale, PaymentMethod } from '@gm-boutique/shared';

export interface ISaleDocument extends Omit<ISale, '_id' | 'createdAt' | 'updatedAt' | 'articles'>, Document {
  articles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISaleDocument>(
  {
    reference: { type: String, required: true, unique: true },
    articles: [{ type: Schema.Types.ObjectId, ref: 'Article', required: true }],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'card', 'twint'], required: true }
  },
  {
    timestamps: true
  }
);

export const Sale = mongoose.model<ISaleDocument>('Sale', saleSchema);
