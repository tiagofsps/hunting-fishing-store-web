import { apiFetch } from './apiClient';
import type { Address } from '../types';

const BASE_URL = '/api/v1/orders';
const PAYMENT_URL = '/api/v1/payments';
const PAYMENT_STORAGE_KEY = 'order_payments';

// ---------------------------------------------------------------------------
// Raw API response shapes
// ---------------------------------------------------------------------------

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

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
  status: OrderStatus;
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
  status: PaymentStatus;
  transactionId: string | null;
  multibancoEntity: string | null;
  multibancoReference: string | null;
  mbwayPhone: string | null;
  paymentUrl: string | null;
  referenceExpiresAt: string | null;
}

export interface CheckoutItemRequest {
  productItemId: number;
  quantity: number;
}

export interface CheckoutRequest {
  shippingAddressId: number;
  billingAddressId?: number;
  couponCode?: string;
  /**
   * Line items taken from the cart the user actually sees, so the order is
   * built from the client cart rather than the server cart mirror.
   *
   * Optional on purpose: when omitted the backend falls back to the server
   * cart. An empty array is NOT a valid fallback — the backend treats a
   * present-but-empty list as "client is the source of truth" and rejects it
   * as an empty cart — so callers must omit the key instead of sending `[]`.
   */
  items?: CheckoutItemRequest[];
}

export interface OrderResult {
  order: OrderResponse;
  payment: PaymentResponse;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function placeOrder(userId: number, payload: CheckoutRequest): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`${BASE_URL}/checkout/${userId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function initiatePayment(payload: {
  orderId: number;
  paymentMethod: string;
  mbwayPhone?: string;
}): Promise<PaymentResponse> {
  return apiFetch<PaymentResponse>(PAYMENT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listUserOrders(userId: number): Promise<OrderResponse[]> {
  return apiFetch<OrderResponse[]>(`${BASE_URL}/user/${userId}`);
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
  return apiFetch<OrderResponse>(`${BASE_URL}/${encodeURIComponent(orderNumber)}`);
}

// ---------------------------------------------------------------------------
// Payment details persistence
//
// `OrderResponse` carries no payment reference, so the payment returned at
// checkout is stored on the client and keyed by order number. It is only used
// to show payment instructions for the order in question.
// ---------------------------------------------------------------------------

type StoredPayments = Record<string, PaymentResponse>;

function readStoredPayments(): StoredPayments {
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as StoredPayments) : {};
  } catch {
    return {};
  }
}

export function storePaymentForOrder(orderNumber: string, payment: PaymentResponse): void {
  try {
    const stored = readStoredPayments();
    stored[orderNumber] = payment;
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // storage is best-effort; payment details are a convenience
  }
}

export function getPaymentForOrder(orderNumber: string): PaymentResponse | null {
  return readStoredPayments()[orderNumber] ?? null;
}
