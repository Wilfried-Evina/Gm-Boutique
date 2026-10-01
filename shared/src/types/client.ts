export interface IClient {
  _id: string;
  referenceNumber: string; // Format: GM-YYYY-XXXX
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  cguAccepted: boolean;
  cguAcceptedAt?: string | Date;
  signatureData?: string; // base64 string
  isDigitalized?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateClientDTO {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  cguAccepted: boolean;
  signatureData?: string;
  isDigitalized?: boolean;
}

export interface UpdateClientDTO extends Partial<CreateClientDTO> {}
