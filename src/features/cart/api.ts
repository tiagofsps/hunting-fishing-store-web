import { apiFetch } from '../../lib/apiClient';
import type { CartItem } from '../../types';
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

/**
 * Maps a server cart response into the renderable client CartItem shape.
 * The server response carries the display fields (name, image, stock, license)
 * needed to render line items without a separate product fetch.
 */
export function cartResponseToItems(resp: CartResponse): CartItem[] {
  return resp.items.map((item) => ({
    product: {
      id: item.productId,
      name: item.productName,
      imageUrl: item.imageUrl ?? undefined,
      stockQuantity: item.stockQuantity ?? undefined,
      requiresLicense: item.requiresLicense ?? false,
      licenseType: item.licenseType ?? undefined,
    },
    selectedItem: {
      id: item.productItemId,
      sku: item.sku,
      price: item.unitPrice,
      stockQuantity: item.stockQuantity ?? 0,
    },
    quantity: item.quantity,
  }));
}