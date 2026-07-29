export * from './enums';
export * from './user';
export * from './client';
export * from './article';
export * from './brand';
export * from './document';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: any;
}
