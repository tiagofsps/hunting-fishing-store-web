export interface CartItemResponse {
  id: number;
  productItemId: number;
  productId: number;
  productName: string;
  imageUrl?: string | null;
  sku: string;
  unitPrice: number;
  quantity: number;
  stockQuantity?: number | null;
  requiresLicense?: boolean;
  licenseType?: 'HUNTING' | 'FISHING' | null;
  subTotal: number;
}

export interface CartResponse {
  id: number;
  userId: number;
  items: CartItemResponse[];
  totalAmount: number;
}