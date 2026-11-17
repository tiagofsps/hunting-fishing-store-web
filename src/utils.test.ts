import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product, Promotion, UserResponse } from './types';
import {
  formatCurrency,
  formatImageUrl,
  getApplicablePromotion,
  getProductImageUrl,
  getProductPrice,
  getProductStock,
  getSalePercentage,
  getSalePrice,
  toAuthUser,
} from './utils';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: 'Rod',
    slug: 'rod',
    categoryId: 10,
    brandId: 20,
    ...overrides,
  } as Product;
}

function promotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: 1,
    name: 'Sale',
    discountPercentage: 10,
    active: true,
    rules: [],
    ...overrides,
  } as Promotion;
}

describe('formatImageUrl', () => {
  it('returns undefined for a missing url', () => {
    expect(formatImageUrl(undefined)).toBeUndefined();
    expect(formatImageUrl('')).toBeUndefined();
  });

  it('keeps external urls untouched', () => {
    expect(formatImageUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
  });

  it('strips the backend host so the dev proxy serves the image', () => {
    expect(formatImageUrl('http://localhost:8080/images/a.jpg')).toBe('/images/a.jpg');
    expect(formatImageUrl('https://localhost:8080/uploads/b.png')).toBe('/uploads/b.png');
  });

  it('keeps relative paths that already point at known prefixes', () => {
    expect(formatImageUrl('/images/a.jpg')).toBe('/images/a.jpg');
    expect(formatImageUrl('/brands/logo.svg')).toBe('/brands/logo.svg');
    expect(formatImageUrl('/api/v1/x')).toBe('/api/v1/x');
    expect(formatImageUrl('/uploads/c.png')).toBe('/uploads/c.png');
  });

  it('makes other relative paths root-relative', () => {
    expect(formatImageUrl('static/a.png')).toBe('/static/a.png');
    expect(formatImageUrl('/static/a.png')).toBe('/static/a.png');
  });
});

describe('getProductPrice', () => {
  it('uses the product price when it is a number', () => {
    expect(getProductPrice(product({ price: 19.9 }))).toBe(19.9);
  });

  it('falls back to the cheapest active item', () => {
    const p = product({
      items: [
        { id: 1, sku: 'a', price: 30, stockQuantity: 1, active: true },
        { id: 2, sku: 'b', price: 12, stockQuantity: 1, active: true },
        { id: 3, sku: 'c', price: 5, stockQuantity: 1, active: false },
      ] as Product['items'],
    });
    expect(getProductPrice(p)).toBe(12);
  });

  it('considers all items when none is active', () => {
    const p = product({
      items: [
        { id: 1, sku: 'a', price: 30, stockQuantity: 1, active: false },
        { id: 2, sku: 'b', price: 8, stockQuantity: 1, active: false },
      ] as Product['items'],
    });
    expect(getProductPrice(p)).toBe(8);
  });

  it('returns 0 when there is no price information', () => {
    expect(getProductPrice(product({ items: [] }))).toBe(0);
  });
});

describe('getProductImageUrl', () => {
  it('prefers the direct image url and normalises it', () => {
    expect(getProductImageUrl(product({ imageUrl: 'http://localhost:8080/images/x.jpg' }))).toBe('/images/x.jpg');
  });

  it('uses the primary gallery image when there is no direct url', () => {
    const p = product({
      images: [
        { id: 1, imageUrl: '/images/first.jpg', isPrimary: false },
        { id: 2, imageUrl: '/images/primary.jpg', isPrimary: true },
      ] as Product['images'],
    });
    expect(getProductImageUrl(p)).toBe('/images/primary.jpg');
  });

  it('falls back to the first gallery image when none is primary', () => {
    const p = product({
      images: [{ id: 1, imageUrl: '/images/first.jpg', isPrimary: false }] as Product['images'],
    });
    expect(getProductImageUrl(p)).toBe('/images/first.jpg');
  });

  it('returns an empty string when the product has no image', () => {
    expect(getProductImageUrl(product())).toBe('');
  });
});

describe('getProductStock', () => {
  it('uses the stock quantity when present, including zero', () => {
    expect(getProductStock(product({ stockQuantity: 0 }))).toBe(0);
    expect(getProductStock(product({ stockQuantity: 7 }))).toBe(7);
  });

  it('sums the stock of every item when there is no product-level quantity', () => {
    const p = product({
      items: [
        { id: 1, sku: 'a', price: 1, stockQuantity: 3 },
        { id: 2, sku: 'b', price: 1, stockQuantity: 4 },
        { id: 3, sku: 'c', price: 1 },
      ] as Product['items'],
    });
    expect(getProductStock(p)).toBe(7);
  });

  it('returns 0 when there is no stock information', () => {
    expect(getProductStock(product())).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats in euros with the pt-PT convention by default', () => {
    expect(formatCurrency(12.5)).toMatch(/^12,50\s€$/);
  });

  it('accepts another locale', () => {
    expect(formatCurrency(12.5, 'en-GB')).toContain('12.50');
  });
});

describe('getApplicablePromotion', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when there are no promotions', () => {
    expect(getApplicablePromotion(product(), [])).toBeNull();
  });

  it('ignores inactive, zero-discount, not-yet-started and expired promotions', () => {
    const promotions = [
      promotion({ id: 1, active: false }),
      promotion({ id: 2, discountPercentage: 0 }),
      promotion({ id: 3, startDate: '2026-07-01T00:00:00Z' }),
      promotion({ id: 4, endDate: '2026-06-01T00:00:00Z' }),
    ];
    expect(getApplicablePromotion(product(), promotions)).toBeNull();
  });

  it('keeps a promotion that is inside its date window', () => {
    const p = promotion({ id: 5, startDate: '2026-06-01T00:00:00Z', endDate: '2026-06-30T00:00:00Z' });
    expect(getApplicablePromotion(product(), [p])?.id).toBe(5);
  });

  it('prefers a product-specific rule over category, brand and global promotions', () => {
    const promotions = [
      promotion({ id: 1, discountPercentage: 50, rules: [] }),
      promotion({ id: 2, discountPercentage: 40, rules: [{ targetType: 'BRAND', targetId: 20 }] as Promotion['rules'] }),
      promotion({ id: 3, discountPercentage: 30, rules: [{ targetType: 'CATEGORY', targetId: 10 }] as Promotion['rules'] }),
      promotion({ id: 4, discountPercentage: 5, rules: [{ targetType: 'PRODUCT', targetId: 1 }] as Promotion['rules'] }),
    ];
    expect(getApplicablePromotion(product(), promotions)?.id).toBe(4);
  });

  it('prefers category over brand, and brand over global', () => {
    const withoutProduct = [
      promotion({ id: 1, discountPercentage: 50, rules: [] }),
      promotion({ id: 2, discountPercentage: 40, rules: [{ targetType: 'BRAND', targetId: 20 }] as Promotion['rules'] }),
    ];
    expect(getApplicablePromotion(product(), withoutProduct)?.id).toBe(2);

    const withCategory = [
      ...withoutProduct,
      promotion({ id: 3, discountPercentage: 30, rules: [{ targetType: 'CATEGORY', targetId: 10 }] as Promotion['rules'] }),
    ];
    expect(getApplicablePromotion(product(), withCategory)?.id).toBe(3);
  });

  it('picks the highest discount among equally specific matches', () => {
    const promotions = [
      promotion({ id: 1, discountPercentage: 10, rules: [{ targetType: 'PRODUCT', targetId: 1 }] as Promotion['rules'] }),
      promotion({ id: 2, discountPercentage: 25, rules: [{ targetType: 'PRODUCT', targetId: 1 }] as Promotion['rules'] }),
    ];
    expect(getApplicablePromotion(product(), promotions)?.id).toBe(2);
  });

  it('does not apply a targeted promotion to a product it does not match', () => {
    const promotions = [promotion({ rules: [{ targetType: 'PRODUCT', targetId: 999 }] as Promotion['rules'] })];
    expect(getApplicablePromotion(product(), promotions)).toBeNull();
  });
});

describe('getSalePercentage and getSalePrice', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports 0 and a null sale price when nothing applies', () => {
    expect(getSalePercentage(product({ price: 10 }), [])).toBe(0);
    expect(getSalePrice(product({ price: 10 }), [])).toBeNull();
  });

  it('applies the discount and rounds to cents', () => {
    const promotions = [promotion({ discountPercentage: 15 })];
    expect(getSalePercentage(product({ price: 10 }), promotions)).toBe(15);
    expect(getSalePrice(product({ price: 10 }), promotions)).toBe(8.5);
    // 19.99 * 0.85 = 16.9915 -> 16.99
    expect(getSalePrice(product({ price: 19.99 }), promotions)).toBe(16.99);
  });
});

describe('toAuthUser', () => {
  it('maps the API user to the client shape and turns nulls into undefined', () => {
    const response = {
      id: 7,
      email: 'a@b.pt',
      firstName: 'Ana',
      lastName: 'Silva',
      phone: null,
      huntingLicenseNumber: 'H-1',
      fishingLicenseNumber: null,
      enabled: true,
      role: 'ROLE_USER',
      addresses: [],
    } as unknown as UserResponse;

    expect(toAuthUser(response)).toEqual({
      id: 7,
      email: 'a@b.pt',
      firstName: 'Ana',
      lastName: 'Silva',
      phone: undefined,
      huntingLicenseNumber: 'H-1',
      fishingLicenseNumber: undefined,
      role: 'ROLE_USER',
      addresses: [],
    });
  });
});
