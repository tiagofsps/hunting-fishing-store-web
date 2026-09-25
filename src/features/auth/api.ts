import { apiFetch } from '../../lib/apiClient';
import type { UserResponse } from '../../types';
import type { LoginResponse, RegisterResponse } from './types';
import type { LoginFormData, RegisterFormData } from './validation';

export async function login(payload: LoginFormData): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterFormData): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/api/v1/auth/logout', { method: 'POST' });
}

export async function me(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/v1/auth/me');
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<void>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}