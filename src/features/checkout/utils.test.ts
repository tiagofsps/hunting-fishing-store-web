import { describe, expect, it } from 'vitest';
import type { CartItem, Product } from '../../types';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  buildOrderItems,
  fromApiPaymentMethod,
  missingLicenses,
  requiredLicenseTypes,
  shippingFeeFor,
  toApiPaymentMethod,
} from './utils';

function line(overrides: Partial<Product> = {}, quantity = 1, variantId: number | null = 1): CartItem {
  return {
    product: { id: 1, name: 'Rod', slug: 'rod', categoryId: 1, brandId: 1, requiresLicense: false, ...overrides } as Product,
    selectedItem: variantId === null ? undefined : ({ id: variantId, sku: `SKU-${variantId}`, price: 10, stockQuantity: 3 } as CartItem['selectedItem']),
    quantity,
  } as CartItem;
}

describe('payment method mapping', () => {
  it('maps every UI method to its API constant and back', () => {
    const pairs = [
      ['mbway', 'MBWAY'],
      ['multibanco', 'MULTIBANCO'],
      ['credit_card', 'CREDIT_CARD'],
      ['klarna', 'KLARNA'],
    ] as const;
    for (const [ui, api] of pairs) {
      expect(toApiPaymentMethod(ui)).toBe(api);
      expect(fromApiPaymentMethod(api)).toBe(ui);
    }
  });

  it('falls back to Multibanco for an unknown API value', () => {
    expect(fromApiPaymentMethod('CASH_ON_DELIVERY')).toBe('multibanco');
  });
});

describe('shippingFeeFor', () => {
  it('charges the flat fee below the free-shipping threshold', () => {
    expect(shippingFeeFor(FREE_SHIPPING_THRESHOLD - 0.01)).toBe(SHIPPING_FEE);
    expect(shippingFeeFor(0)).toBe(SHIPPING_FEE);
  });

  it('ships free at and above the threshold', () => {
    expect(shippingFeeFor(FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(shippingFeeFor(500)).toBe(0);
  });
});

describe('requiredLicenseTypes', () => {
  it('needs nothing when no line requires a licence', () => {
    expect([...requiredLicenseTypes([line()])]).toEqual([]);
  });

  it('needs only the type a product declares', () => {
    expect([...requiredLicenseTypes([line({ requiresLicense: true, licenseType: 'HUNTING' })])]).toEqual(['HUNTING']);
    expect([...requiredLicenseTypes([line({ requiresLicense: true, licenseType: 'FISHING' })])]).toEqual(['FISHING']);
  });

  it('needs both types when a licence is required but no type is declared', () => {
    const required = requiredLicenseTypes([line({ requiresLicense: true })]);
    expect(required.has('HUNTING')).toBe(true);
    expect(required.has('FISHING')).toBe(true);
  });
});

describe('missingLicenses', () => {
  const regulated = [line({ requiresLicense: true, licenseType: 'HUNTING' })];

  it('reports nothing missing when the cart needs no licence', () => {
    expect(missingLicenses([line()], null)).toEqual({ hunting: false, fishing: false });
  });

  it('reports the hunting licence missing when not declared', () => {
    expect(missingLicenses(regulated, { huntingLicenseNumber: '' })).toEqual({ hunting: true, fishing: false });
  });

  it('treats an empty declared number as missing', () => {
    expect(missingLicenses(regulated, { huntingLicenseNumber: '' }).hunting).toBe(true);
  });

  it('clears the requirement once the licence is declared', () => {
    expect(missingLicenses(regulated, { huntingLicenseNumber: 'H-1' })).toEqual({ hunting: false, fishing: false });
  });

  it('reports every required licence when the user is signed out', () => {
    const both = [line({ requiresLicense: true })];
    expect(missingLicenses(both, undefined)).toEqual({ hunting: true, fishing: true });
  });
});

describe('buildOrderItems', () => {
  it('lists every line when each has a variant', () => {
    expect(buildOrderItems([line({}, 2, 7), line({ id: 2 }, 1, 9)])).toEqual([
      { productItemId: 7, quantity: 2 },
      { productItemId: 9, quantity: 1 },
    ]);
  });

  it('omits the list entirely when any line has no variant, rather than sending a partial order', () => {
    expect(buildOrderItems([line({}, 1, 7), line({ id: 2 }, 1, null)])).toBeUndefined();
  });

  it('omits the list for an empty cart so the backend decides', () => {
    expect(buildOrderItems([])).toBeUndefined();
  });
});
