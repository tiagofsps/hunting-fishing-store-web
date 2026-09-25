import type { UserResponse } from '../../types';

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  role: string;
}

export interface RegisterResponse {
  user: UserResponse;
  accessToken: string;
  tokenType: string;
}