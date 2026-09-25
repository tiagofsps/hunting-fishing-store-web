import type { PaymentMethod } from './types';

export function toApiPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'mbway':
      return 'MBWAY';
    case 'multibanco':
      return 'MULTIBANCO';
    case 'credit_card':
      return 'CREDIT_CARD';
    case 'klarna':
      return 'KLARNA';
  }
}

export function fromApiPaymentMethod(method: string): PaymentMethod {
  switch (method) {
    case 'MBWAY':
      return 'mbway';
    case 'MULTIBANCO':
      return 'multibanco';
    case 'CREDIT_CARD':
      return 'credit_card';
    case 'KLARNA':
      return 'klarna';
    default:
      return 'multibanco';
  }
}