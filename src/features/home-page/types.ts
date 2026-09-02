export interface ProductItem {
  id: number;
  sku?: string;
  price: number;
  stockQuantity: number;
  weight?: number | null;
  active?: boolean;
  attributes?: Record<string, string>;
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

