import { apiFetch } from '../../lib/apiClient';
import type { UserResponse } from '../../types';
import type { AddressFormData } from './validation';
import type { CheckoutRequest, OrderResponse, PaymentResponse } from './types';

export async function checkout(userId: number, payload: CheckoutRequest): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`/api/v1/orders/checkout/${userId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function initiatePayment(payload: {
  orderId: number;
  paymentMethod: string;
  mbwayPhone?: string;
}): Promise<PaymentResponse> {
  return apiFetch<PaymentResponse>('/api/v1/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addAddress(userId: number, payload: AddressFormData): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/api/v1/users/${userId}/addresses`, {
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
  return apiFetch<UserResponse>(`/api/v1/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}