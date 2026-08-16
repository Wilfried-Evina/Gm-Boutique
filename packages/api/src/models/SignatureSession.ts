import mongoose, { Document, Schema } from 'mongoose';

export interface ISignatureSession extends Document {
  token: string;
  status: 'pending' | 'completed' | 'expired';
  signatureType: 'first_deposit' | 'standard';
  signatureBase64?: string;
  cguAccepted?: boolean;
  createdAt: Date;
}

const SignatureSessionSchema: Schema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
    signatureType: { type: String, enum: ['first_deposit', 'standard'], required: true },
    signatureBase64: { type: String },
    cguAccepted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 900 } // S'autodétruit après 15 minutes (900 secondes)
  }
);

export const SignatureSession = mongoose.model<ISignatureSession>('SignatureSession', SignatureSessionSchema);
