import type { Page } from '../../types';

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

export interface NewsletterSubscriptionResponse {
  id: number;
  email: string;
  active: boolean;
  subscribedAt: string;
}

export type ProductPage = Page<ProductResponse>;

// Temporary re-exports for legacy consumers (App, checkout) while they migrate
// to `src/types`. Removed once those consumers are rewritten.
export type {
  ProductItem,
  ProductImage,
  Product,
  Category,
  Brand,
  Promotion,
  CartItem,
} from '../../types';