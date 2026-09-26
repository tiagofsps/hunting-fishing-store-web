import { apiFetch } from '../../lib/apiClient';
import type { UserResponse } from '../../types';
import type { AccountAddressFormData, ProfileFormData } from './validation';

const BASE_URL = '/api/v1/users';

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  huntingLicenseNumber?: string;
  fishingLicenseNumber?: string;
}

/** Only sends non-empty fields: the backend applies a partial update. */
export function toProfileUpdatePayload(data: ProfileFormData): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = {};
  if (data.firstName) payload.firstName = data.firstName;
  if (data.lastName) payload.lastName = data.lastName;
  if (data.phone) payload.phone = data.phone;
  if (data.huntingLicenseNumber) payload.huntingLicenseNumber = data.huntingLicenseNumber;
  if (data.fishingLicenseNumber) payload.fishingLicenseNumber = data.fishingLicenseNumber;
  return payload;
}

export async function fetchUser(userId: number): Promise<UserResponse> {
  return apiFetch<UserResponse>(`${BASE_URL}/${userId}`);
}

export async function updateProfile(userId: number, payload: ProfileUpdatePayload): Promise<UserResponse> {
  return apiFetch<UserResponse>(`${BASE_URL}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function addAddress(userId: number, payload: AccountAddressFormData): Promise<UserResponse> {
  return apiFetch<UserResponse>(`${BASE_URL}/${userId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAddress(
  userId: number,
  addressId: number,
  payload: AccountAddressFormData
): Promise<UserResponse> {
  return apiFetch<UserResponse>(`${BASE_URL}/${userId}/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAddress(userId: number, addressId: number): Promise<void> {
  await apiFetch<void>(`${BASE_URL}/${userId}/addresses/${addressId}`, { method: 'DELETE' });
}

export async function changePassword(
  userId: number,
  payload: { currentPassword: string; newPassword: string }
): Promise<void> {
  await apiFetch<void>(`${BASE_URL}/${userId}/password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
