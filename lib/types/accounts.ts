import { BaseEntity } from './table';
import { UserRole } from './auth';

export interface CreateAccountData {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export interface AccountEntity extends BaseEntity {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
  lastSignInAt?: string;
}
