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

// ---------------------------------------------------------------------------
// Categories, brands and stock
// ---------------------------------------------------------------------------

const CATEGORIES_URL = '/api/v1/categories';
const BRANDS_URL = '/api/v1/brands';
const STOCK_URL = '/api/v1/stock-movements';

export type MovementType = 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT';

export interface AdminCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  parentCategoryId?: number;
}

export interface AdminBrandPayload {
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface StockMovement {
  id: number;
  productItemId: number;
  sku: string;
  quantity: number;
  type: MovementType;
  notes?: string;
  userId?: number;
  createdAt: string;
}

export async function createCategory(payload: AdminCategoryPayload): Promise<void> {
  await apiFetch(CATEGORIES_URL, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateCategory(id: number, payload: AdminCategoryPayload): Promise<void> {
  await apiFetch(`${CATEGORIES_URL}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteCategory(id: number): Promise<void> {
  await apiFetch<void>(`${CATEGORIES_URL}/${id}`, { method: 'DELETE' });
}

export async function createBrand(payload: AdminBrandPayload): Promise<void> {
  await apiFetch(BRANDS_URL, { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateBrand(id: number, payload: AdminBrandPayload): Promise<void> {
  await apiFetch(`${BRANDS_URL}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteBrand(id: number): Promise<void> {
  await apiFetch<void>(`${BRANDS_URL}/${id}`, { method: 'DELETE' });
}

export async function createStockMovement(payload: {
  productItemId: number;
  quantity: number;
  type: MovementType;
  notes?: string;
  userId?: number;
}): Promise<StockMovement> {
  return apiFetch<StockMovement>(STOCK_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listStockMovements(productItemId: number): Promise<StockMovement[]> {
  return apiFetch<StockMovement[]>(`${STOCK_URL}/item/${productItemId}`);
}

// ---------------------------------------------------------------------------
// Coupons and promotions
//
// The backend exposes coupons as create + read only (no PUT/DELETE), and
// promotions have no PUT either, so promotion edits are done as delete+create.
// ---------------------------------------------------------------------------

const COUPONS_URL = '/api/v1/coupons';
const PROMOTIONS_URL = '/api/v1/promotions';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type PromotionTargetType = 'CATEGORY' | 'BRAND' | 'PRODUCT';

export interface AdminCoupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  validFrom: string;
  validTo: string;
  active: boolean;
}

export interface AdminPromotion {
  id: number;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  priority: number | null;
  stackable: boolean;
  validFrom: string;
  validTo: string;
  active: boolean;
  rules: { id: number; targetType: PromotionTargetType; targetId: number }[];
}

/** Mirrors the backend ALLOWED_TRANSITIONS map. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function listCoupons(): Promise<AdminCoupon[]> {
  return apiFetch<AdminCoupon[]>(COUPONS_URL);
}

export async function createCoupon(payload: {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  validFrom: string;
  validTo: string;
}): Promise<AdminCoupon> {
  return apiFetch<AdminCoupon>(COUPONS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listPromotions(): Promise<AdminPromotion[]> {
  return apiFetch<AdminPromotion[]>(PROMOTIONS_URL);
}

export async function createPromotion(payload: {
  name: string;
  discountType: DiscountType;
  discountValue: number;
  priority?: number;
  stackable: boolean;
  validFrom: string;
  validTo: string;
  rules: { targetType: PromotionTargetType; targetId: number }[];
}): Promise<AdminPromotion> {
  return apiFetch<AdminPromotion>(PROMOTIONS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePromotion(id: number): Promise<void> {
  await apiFetch<void>(`${PROMOTIONS_URL}/${id}`, { method: 'DELETE' });
}
