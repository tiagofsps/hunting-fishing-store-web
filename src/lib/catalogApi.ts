import { apiFetch } from './apiClient';
import type { Product, ProductItem, ProductImage, Category, Brand, Promotion, PromotionRule, Page, LocalizedText } from '../types';

const BASE_URL = '/api/v1';

// ---------------------------------------------------------------------------
// Raw API response shapes
// ---------------------------------------------------------------------------

export interface ProductItemResponse {
  id: number;
  sku: string;
  price: number;
  stockQuantity: number;
  weight: number | null;
  active: boolean;
  attributes: Record<string, string | number>;
}

export interface ProductImageResponse {
  id: number;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  translations: Record<string, LocalizedText> | null;
  requiresLicense: boolean;
  licenseType: 'HUNTING' | 'FISHING' | null;
  categoryId: number;
  brandId: number;
  items: ProductItemResponse[];
  images: ProductImageResponse[];
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description: string;
  translations: Record<string, LocalizedText> | null;
  parentCategoryId: number | null;
  productCount: number;
}

export interface BrandResponse {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
}

export interface PromotionRuleResponse {
  id: number;
  targetType: string;
  targetId: number;
}

export interface PromotionResponse {
  id: number;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  priority: number;
  stackable: boolean;
  validFrom: string;
  validTo: string;
  active: boolean;
  rules: PromotionRuleResponse[];
}

export type ProductPage = Page<ProductResponse>;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function mapProduct(response: ProductResponse): Product {
  return {
    id: response.id,
    name: response.name,
    slug: response.slug,
    description: response.description,
    translations: response.translations ?? undefined,
    requiresLicense: response.requiresLicense,
    licenseType: response.licenseType ?? undefined,
    categoryId: response.categoryId,
    brandId: response.brandId,
    items: response.items.map(
      (item): ProductItem => ({
        id: item.id,
        sku: item.sku,
        price: item.price,
        stockQuantity: item.stockQuantity,
        weight: item.weight,
        active: item.active,
        attributes: item.attributes,
      })
    ),
    images: response.images.map(
      (img): ProductImage => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText ?? undefined,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder,
      })
    ),
  };
}

function mapCategory(response: CategoryResponse): Category {
  return {
    id: response.id,
    name: response.name,
    slug: response.slug,
    description: response.description,
    translations: response.translations ?? undefined,
    parentCategoryId: response.parentCategoryId,
    productCount: response.productCount,
  };
}

function mapBrand(response: BrandResponse): Brand {
  return {
    id: response.id,
    name: response.name,
    slug: response.slug,
    logoUrl: response.logoUrl,
  };
}

function mapPromotion(response: PromotionResponse): Promotion {
  return {
    id: response.id,
    title: response.name,
    description: '',
    discountPercentage: response.discountType === 'PERCENTAGE' ? response.discountValue : 0,
    active: response.active,
    startDate: response.validFrom,
    endDate: response.validTo,
    rules: response.rules.map(
      (rule): PromotionRule => ({
        targetType: rule.targetType as PromotionRule['targetType'],
        targetId: rule.targetId,
      })
    ),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface GetProductsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  brandId?: number;
  q?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export async function getProductsPage(params: GetProductsParams = {}): Promise<Page<Product>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));
  if (params.categoryId !== undefined) query.set('categoryId', String(params.categoryId));
  if (params.brandId !== undefined) query.set('brandId', String(params.brandId));
  if (params.q) query.set('q', params.q);
  if (params.sort) query.set('sort', params.sort);
  if (params.direction) query.set('direction', params.direction);

  const page = await apiFetch<ProductPage>(`${BASE_URL}/products?${query.toString()}`);
  return { ...page, content: page.content.map(mapProduct) };
}

export async function getProductById(id: number): Promise<Product> {
  const response = await apiFetch<ProductResponse>(`${BASE_URL}/products/${id}`);
  return mapProduct(response);
}

export async function getCategories(): Promise<Category[]> {
  const data = await apiFetch<CategoryResponse[]>(`${BASE_URL}/categories`);
  return data.map(mapCategory);
}

export async function getBrands(): Promise<Brand[]> {
  const data = await apiFetch<BrandResponse[]>(`${BASE_URL}/brands`);
  return data.map(mapBrand);
}

export async function getPromotions(): Promise<Promotion[]> {
  const data = await apiFetch<PromotionResponse[]>(`${BASE_URL}/promotions`);
  return data.map(mapPromotion);
}