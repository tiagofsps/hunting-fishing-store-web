import { apiFetch } from '../../lib/apiClient';
import { mapProduct, type ProductResponse } from '../../lib/catalogApi';
import type { Page, Product, UserResponse } from '../../types';
import type { OrderResponse, OrderStatus } from '../../lib/ordersApi';
import type { AdminProductFormData } from './validation';

const USERS_URL = '/api/v1/users';
const ORDERS_URL = '/api/v1/orders';
const PRODUCTS_URL = '/api/v1/products';

export interface AdminProductPayload {
  name: string;
  slug: string;
  description?: string;
  requiresLicense: boolean;
  licenseType?: 'HUNTING' | 'FISHING';
  categoryId: number;
  brandId: number;
  items: {
    sku: string;
    price: number;
    stockQuantity: number;
    weight?: number;
    active: boolean;
    attributes?: Record<string, string>;
  }[];
  images: {
    imageUrl: string;
    altText?: string;
    isPrimary: boolean;
    displayOrder: number;
  }[];
}

/** Only sends the fields the backend validates as optional when present. */
export function toAdminProductPayload(data: AdminProductFormData): AdminProductPayload {
  return {
    name: data.name,
    slug: data.slug,
    ...(data.description ? { description: data.description } : {}),
    requiresLicense: data.requiresLicense,
    ...(data.licenseType ? { licenseType: data.licenseType } : {}),
    categoryId: data.categoryId,
    brandId: data.brandId,
    items: data.items.map((item) => ({
      sku: item.sku,
      price: item.price,
      stockQuantity: item.stockQuantity,
      ...(item.weight !== undefined ? { weight: item.weight } : {}),
      active: item.active,
      ...(item.attributes && Object.keys(item.attributes).length > 0 ? { attributes: item.attributes } : {}),
    })),
    images: data.images.map((image) => ({
      imageUrl: image.imageUrl,
      ...(image.altText ? { altText: image.altText } : {}),
      isPrimary: image.isPrimary,
      displayOrder: image.displayOrder,
    })),
  };
}

export async function createProduct(payload: AdminProductPayload): Promise<Product> {
  const created = await apiFetch<ProductResponse>(PRODUCTS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapProduct(created);
}

export async function updateProduct(id: number, payload: AdminProductPayload): Promise<Product> {
  const updated = await apiFetch<ProductResponse>(`${PRODUCTS_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapProduct(updated);
}

export async function deleteProduct(id: number): Promise<void> {
  await apiFetch<void>(`${PRODUCTS_URL}/${id}`, { method: 'DELETE' });
}

export async function listUsers(page: number, size: number): Promise<Page<UserResponse>> {
  return apiFetch<Page<UserResponse>>(`${USERS_URL}?page=${page}&size=${size}`);
}

export async function listAllOrders(page: number, size: number): Promise<Page<OrderResponse>> {
  return apiFetch<Page<OrderResponse>>(`${ORDERS_URL}?page=${page}&size=${size}`);
}

export async function listOrdersByStatus(
  page: number,
  size: number,
  status: OrderStatus
): Promise<Page<OrderResponse>> {
  return apiFetch<Page<OrderResponse>>(`${ORDERS_URL}?page=${page}&size=${size}&status=${status}`);
}

export async function updateOrderStatus(orderNumber: string, status: OrderStatus): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(
    `${ORDERS_URL}/${encodeURIComponent(orderNumber)}?status=${status}`
  );
}
