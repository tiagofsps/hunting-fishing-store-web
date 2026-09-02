import type { CartItem } from '../home-page/types';

export type PaymentMethod = 'mbway' | 'multibanco' | 'credit_card' | 'klarna';

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  nif?: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface CheckoutFormData {
  shipping: ShippingAddress;
  licenseFile?: File | null;
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  mbwayPhone?: string;
}

export interface OrderResult {
  orderId: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shipping: ShippingAddress;
  paymentMethod: PaymentMethod;
  multibancoEntity?: string;
  multibancoRef?: string;
  mbwayPhone?: string;
}
