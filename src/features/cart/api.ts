import { apiFetch } from '../../lib/apiClient';
import type { CartResponse } from './types';

export async function getCart(userId: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/v1/carts/${userId}`);
}

export async function addToCart(userId: number, productItemId: number, quantity: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/v1/carts/${userId}/items`, {
    method: 'POST',
    body: JSON.stringify({ productItemId, quantity }),
  });
}

export async function updateQuantity(userId: number, productItemId: number, quantity: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/v1/carts/${userId}/items/${productItemId}?quantity=${quantity}`, {
    method: 'PUT',
  });
}

export async function removeFromCart(userId: number, productItemId: number): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/v1/carts/${userId}/items/${productItemId}`, {
    method: 'DELETE',
  });
}

export async function clearCart(userId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/carts/${userId}`, { method: 'DELETE' });
}