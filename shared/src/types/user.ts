import { UserRole } from './enums';

export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}
