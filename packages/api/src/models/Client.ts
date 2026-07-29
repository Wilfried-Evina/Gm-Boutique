import mongoose, { Document, Schema } from 'mongoose';
import { IClient } from '@gm-boutique/shared';
import { Counter } from './Counter';

export interface IClientDocument extends Omit<IClient, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClientDocument>(
  {
    referenceNumber: { type: String, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    cguAccepted: { type: Boolean, default: false },
    cguAcceptedAt: { type: Date },
    signatureData: { type: String },
  },
  { timestamps: true }
);

// Auto-increment logic for Reference Number
clientSchema.pre('save', async function (next) {
  if (this.isNew && !this.referenceNumber) {
    try {
      const year = new Date().getFullYear();
      const counterId = `client_${year}`;
      
      const counter = await Counter.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      const sequenceString = counter.seq.toString().padStart(4, '0');
      this.referenceNumber = `GM-${year}-${sequenceString}`;
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

// Indexes for search (Full-text and exact matches)
clientSchema.index({ firstName: 'text', lastName: 'text', phone: 'text', referenceNumber: 'text' });
clientSchema.index({ phone: 1 });

export const Client = mongoose.model<IClientDocument>('Client', clientSchema);
