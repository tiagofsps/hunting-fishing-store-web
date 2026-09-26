import { apiFetch } from '../../lib/apiClient';
import type { UserResponse } from '../../types';
import type { AddressFormData } from './validation';

const BASE_URL = '/api/v1';

export async function addAddress(userId: number, payload: AddressFormData): Promise<UserResponse> {
  return apiFetch<UserResponse>(`${BASE_URL}/users/${userId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(
  userId: number,
  payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    huntingLicenseNumber?: string;
    fishingLicenseNumber?: string;
  }
): Promise<UserResponse> {
  return apiFetch<UserResponse>(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
