import { apiFetch } from '../../lib/apiClient';
import type { Product, Category, Brand, Promotion, PromotionRule } from '../../types';
import type {
  ProductPage,
  ProductResponse,
  CategoryResponse,
  BrandResponse,
  PromotionResponse,
  NewsletterSubscriptionResponse,
} from './types';

const BASE_URL = '/api/v1';

export interface GetProductsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  brandId?: number;
  q?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

function mapProduct(response: ProductResponse): Product {
  return {
    id: response.id,
    name: response.name,
    slug: response.slug,
    description: response.description,
    requiresLicense: response.requiresLicense,
    licenseType: response.licenseType ?? undefined,
    categoryId: response.categoryId,
    brandId: response.brandId,
    items: response.items.map((item) => ({
      id: item.id,
      sku: item.sku,
      price: item.price,
      stockQuantity: item.stockQuantity,
      weight: item.weight,
      active: item.active,
      attributes: item.attributes,
    })),
    images: response.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      altText: img.altText ?? undefined,
      isPrimary: img.isPrimary,
      displayOrder: img.displayOrder,
    })),
  };
}

function mapPromotion(response: PromotionResponse): Promotion {
  return {
    id: response.id,
    title: response.name,
    description: '',
    discountPercentage: response.discountType === 'PERCENTAGE' ? response.discountValue : 0,
    startDate: response.validFrom,
    endDate: response.validTo,
    rules: response.rules.map((rule) => ({
      targetType: rule.targetType as PromotionRule['targetType'],
      targetId: rule.targetId,
    })),
  };
}

export async function getProducts(params: GetProductsParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 100));
  if (params.categoryId !== undefined) query.set('categoryId', String(params.categoryId));
  if (params.brandId !== undefined) query.set('brandId', String(params.brandId));
  if (params.q) query.set('q', params.q);
  if (params.sort) query.set('sort', params.sort);
  if (params.direction) query.set('direction', params.direction);

  const page = await apiFetch<ProductPage>(`${BASE_URL}/products?${query.toString()}`);
  return page.content.map(mapProduct);
}

export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<CategoryResponse[]>(`${BASE_URL}/categories`);
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parentCategoryId: c.parentCategoryId,
    productCount: c.productCount,
  }));
}

export async function getBrands(): Promise<Brand[]> {
  const data = await apiFetch<BrandResponse[]>(`${BASE_URL}/brands`);
  return data.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logoUrl: b.logoUrl,
  }));
}

export async function getPromotions(): Promise<Promotion[]> {
  const data = await apiFetch<PromotionResponse[]>(`${BASE_URL}/promotions`);
  return data.map(mapPromotion);
}

export async function subscribeNewsletter(email: string): Promise<NewsletterSubscriptionResponse> {
  return apiFetch<NewsletterSubscriptionResponse>(`${BASE_URL}/newsletter/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function unsubscribeNewsletter(email: string): Promise<void> {
  await apiFetch<void>(`${BASE_URL}/newsletter/subscribe`, {
    method: 'DELETE',
    body: JSON.stringify({ email }),
  });
}