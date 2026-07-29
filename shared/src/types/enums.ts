export enum UserRole {
  ADMIN = 'admin',
  GERANTE = 'gerante',
}

export enum ArticleStatus {
  DEPOSITED = 'deposited',
  ON_SALE = 'on_sale',
  SOLD = 'sold',
  RETURNED = 'returned',
}

export enum ActionOnExpiry {
  REDUCE_PRICE = 'reduce_price',
  RETURN_TO_CLIENT = 'return_to_client',
}
