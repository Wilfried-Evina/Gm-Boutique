import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReceipt extends Document {
  clientId: Types.ObjectId;
  type: 'deposit' | 'restitution';
  articleIds: Types.ObjectId[];
  signatureData: string; // Base64 image
  referenceNumber: string; // e.g. DEP-1234 or RES-1234
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    type: { type: String, enum: ['deposit', 'restitution'], required: true },
    articleIds: [{ type: Schema.Types.ObjectId, ref: 'Article', required: true }],
    signatureData: { type: String, required: true },
    referenceNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Receipt = mongoose.model<IReceipt>('Receipt', receiptSchema);
