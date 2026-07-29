export interface IDocument {
  _id: string;
  clientId: string;
  type: 'deposit' | 'retrocession';
  fileUrl: string;
  sentByEmail: boolean;
  sentAt?: string | Date;
  createdAt: string | Date;
}
