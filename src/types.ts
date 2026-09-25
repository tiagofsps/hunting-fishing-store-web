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

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description?: string;
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

export interface Promotion {
  id: number;
  title: string;
  description: string;
  discountPercentage: number;
  startDate?: string;
  endDate?: string;
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