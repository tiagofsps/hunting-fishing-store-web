export interface CartItemResponse {
  id: number;
  productItemId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface CartResponse {
  id: number;
  userId: number;
  items: CartItemResponse[];
  totalAmount: number;
}