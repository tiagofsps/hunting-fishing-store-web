import type { CartItem } from '../../types';
import type { CheckoutItemRequest } from '../../lib/ordersApi';
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

// ----------------------------------------------------------------- cart rules

/** Display-only estimate; the backend computes the authoritative order total. */
export const FREE_SHIPPING_THRESHOLD = 75;
export const SHIPPING_FEE = 4.95;

export function shippingFeeFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export type LicenseType = 'HUNTING' | 'FISHING';

/**
 * Licence types a cart needs. A regulated product with no declared type needs
 * both, because the buyer must hold either licence.
 */
export function requiredLicenseTypes(cartItems: CartItem[]): Set<LicenseType> {
  const required = new Set<LicenseType>();
  cartItems.forEach((item) => {
    if (!item.product.requiresLicense) return;
    if (item.product.licenseType === 'HUNTING') required.add('HUNTING');
    else if (item.product.licenseType === 'FISHING') required.add('FISHING');
    else {
      required.add('HUNTING');
      required.add('FISHING');
    }
  });
  return required;
}

export interface MissingLicenses {
  hunting: boolean;
  fishing: boolean;
}

/** Licences the cart needs that the user has not yet declared. */
export function missingLicenses(
  cartItems: CartItem[],
  user: { huntingLicenseNumber?: string; fishingLicenseNumber?: string } | null | undefined
): MissingLicenses {
  const required = requiredLicenseTypes(cartItems);
  return {
    hunting: required.has('HUNTING') && !user?.huntingLicenseNumber,
    fishing: required.has('FISHING') && !user?.fishingLicenseNumber,
  };
}

/**
 * Order lines built from the cart the user sees. A line with no variant cannot
 * be ordered, so the whole list is omitted (`undefined`) and the backend falls
 * back to the server cart. Partial lists are never sent, because that would
 * create an order missing items the customer paid for.
 */
export function buildOrderItems(cartItems: CartItem[]): CheckoutItemRequest[] | undefined {
  const orderable = cartItems.flatMap((i) =>
    i.selectedItem ? [{ productItemId: i.selectedItem.id, quantity: i.quantity }] : []
  );
  return cartItems.length > 0 && orderable.length === cartItems.length ? orderable : undefined;
}
