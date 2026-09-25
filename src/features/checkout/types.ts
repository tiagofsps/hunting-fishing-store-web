import type { Address } from '../../types';

export type PaymentMethod = 'mbway' | 'multibanco' | 'credit_card' | 'klarna';

export interface CheckoutRequest {
  shippingAddressId: number;
  billingAddressId?: number;
  couponCode?: string;
}

export interface OrderItemResponse {
  id: number;
  productItemId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingCost: number;
  userId: number;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItemResponse[];
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string | null;
  multibancoEntity: string | null;
  multibancoReference: string | null;
  mbwayPhone: string | null;
  paymentUrl: string | null;
  referenceExpiresAt: string | null;
}

export interface OrderResult {
  order: OrderResponse;
  payment: PaymentResponse;
}