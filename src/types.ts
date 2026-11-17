export interface ProductItem {
  id: number;
  sku?: string;
  price: number;
  stockQuantity: number;
  weight?: number | null;
  active?: boolean;
  attributes?: Record<string, string | number>;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export type ContentLocale = 'en' | 'pt';

export interface LocalizedText {
  name: string;
  description?: string | null;
}

type ContentTranslations = Partial<Record<ContentLocale, LocalizedText>>;

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  translations?: ContentTranslations;
  requiresLicense?: boolean;
  licenseType?: 'HUNTING' | 'FISHING';
  categoryId?: number;
  brandId?: number;
  items?: ProductItem[];
  images?: ProductImage[];

  // Optional direct legacy properties
  price?: number;
  imageUrl?: string;
  stockQuantity?: number;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  translations?: ContentTranslations;
  parentCategoryId?: number | null;
  productCount?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}

export interface PromotionRule {
  targetType: 'CATEGORY' | 'BRAND' | 'PRODUCT';
  targetId: number;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  discountPercentage: number;
  /** Server-side flag. When false the promotion must never be applied. */
  active?: boolean;
  startDate?: string;
  endDate?: string;
  rules?: PromotionRule[];
}

export interface CartItem {
  product: Product;
  selectedItem?: ProductItem;
  quantity: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type AddressType = 'SHIPPING' | 'BILLING';

export interface Address {
  id: number;
  recipientName: string;
  recipientPhone: string;
  street: string;
  city: string;
  postalCode: string;
  countryCode: string;
  addressType: AddressType;
}

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  huntingLicenseNumber?: string;
  fishingLicenseNumber?: string;
  role: UserRole;
  addresses: Address[];
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  huntingLicenseNumber: string | null;
  fishingLicenseNumber: string | null;
  enabled: boolean;
  addresses: Address[];
  role: UserRole;
}