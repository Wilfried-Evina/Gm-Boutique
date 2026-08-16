import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export interface IDocument extends MongooseDocument {
  clientId?: mongoose.Types.ObjectId;
  type: 'deposit' | 'retrocession' | 'client_profile' | 'sales_report' | 'other';
  fileUrl: string;
  referenceNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
    },
    type: {
      type: String,
      enum: ['deposit', 'retrocession', 'client_profile', 'sales_report', 'other'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
