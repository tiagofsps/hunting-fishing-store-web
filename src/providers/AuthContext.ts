import { createContext } from 'react';
import type { AuthUser } from '../types';
import type { LoginFormData, RegisterFormData } from '../features/auth/validation';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (payload: LoginFormData) => Promise<void>;
  register: (payload: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);