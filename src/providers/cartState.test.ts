import { describe, expect, it } from 'vitest';
import type { CartItem, Product, ProductItem } from '../types';
import {
  addLine,
  cartTotals,
  guestLinesToSync,
  isSameLine,
  parseStoredCart,
  removeLine,
  resolveVariant,
  setLineQuantity,
} from './cartState';

const variant = (overrides: Partial<ProductItem> = {}): ProductItem =>
  ({ id: 1, sku: 'A', price: 10, stockQuantity: 5, active: true, ...overrides }) as ProductItem;

const product = (overrides: Partial<Product> = {}): Product =>
  ({ id: 100, name: 'Rod', slug: 'rod', categoryId: 1, brandId: 1, requiresLicense: false, ...overrides }) as Product;

const line = (productId: number, sku: string | undefined, quantity = 1, price = 10): CartItem =>
  ({
    product: product({ id: productId, price }),
    selectedItem: sku === undefined ? undefined : variant({ sku, id: productId * 10, price }),
    quantity,
  }) as CartItem;

describe('resolveVariant', () => {
  it('keeps an explicitly chosen variant', () => {
    const chosen = variant({ id: 9, sku: 'CHOSEN' });
    expect(resolveVariant(chosen, product({ items: [variant({ id: 1 })] }))).toBe(chosen);
  });

  it('falls back to the first active, in-stock variant', () => {
    const items = [
      variant({ id: 1, active: false, stockQuantity: 9 }),
      variant({ id: 2, stockQuantity: 0 }),
      variant({ id: 3, stockQuantity: 4 }),
    ];
    expect(resolveVariant(undefined, product({ items }))?.id).toBe(3);
  });

  it('returns undefined when no variant can be ordered', () => {
    expect(resolveVariant(undefined, product({ items: [variant({ stockQuantity: 0 })] }))).toBeUndefined();
    expect(resolveVariant(undefined, product())).toBeUndefined();
  });
});

describe('parseStoredCart', () => {
  it('returns an empty cart when nothing is stored', () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart('')).toEqual([]);
  });

  it('returns an empty cart for corrupt or non-array data instead of throwing', () => {
    expect(parseStoredCart('{not json')).toEqual([]);
    expect(parseStoredCart('{"items":[]}')).toEqual([]);
  });

  it('resolves a missing variant on lines persisted before variants were required', () => {
    const stored = [{ product: product({ items: [variant({ id: 5, stockQuantity: 2 })] }), quantity: 2 }];
    const [restored] = parseStoredCart(JSON.stringify(stored));
    expect(restored.selectedItem?.id).toBe(5);
    expect(restored.quantity).toBe(2);
  });
});

describe('isSameLine', () => {
  it('matches on product and variant SKU together', () => {
    const item = line(1, 'A');
    expect(isSameLine(item, 1, 'A')).toBe(true);
    expect(isSameLine(item, 1, 'B')).toBe(false);
    expect(isSameLine(item, 2, 'A')).toBe(false);
  });
});

describe('addLine', () => {
  it('appends a new line with the resolved variant and returns that variant for the API call', () => {
    const items = [line(1, 'A')];
    const p = product({ id: 2, items: [variant({ id: 20, sku: 'Z' })] });

    const { next, variant: resolved } = addLine(items, p, undefined, 3);

    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ quantity: 3, selectedItem: { id: 20, sku: 'Z' } });
    expect(resolved?.id).toBe(20);
  });

  it('increments an existing line instead of duplicating it', () => {
    const items = [line(1, 'A', 2)];
    const p = product({ id: 1, items: [variant({ sku: 'A' })] });

    const { next } = addLine(items, p, undefined, 1);

    expect(next).toHaveLength(1);
    expect(next[0].quantity).toBe(3);
  });

  it('keeps two variants of one product as separate lines', () => {
    const p = product({ id: 1 });
    const first = addLine([], p, variant({ sku: 'S' }), 1).next;
    const second = addLine(first, p, variant({ sku: 'L' }), 1).next;
    expect(second.map((i) => i.selectedItem?.sku)).toEqual(['S', 'L']);
  });
});

describe('line updates', () => {
  it('sets the quantity on the matching line only', () => {
    const items = [line(1, 'A', 1), line(2, 'B', 1)];
    expect(setLineQuantity(items, 1, 'A', 7).map((i) => i.quantity)).toEqual([7, 1]);
  });

  it('removes only the matching line', () => {
    const items = [line(1, 'A'), line(1, 'B'), line(2, 'A')];
    expect(removeLine(items, 1, 'A').map((i) => [i.product.id, i.selectedItem?.sku])).toEqual([
      [1, 'B'],
      [2, 'A'],
    ]);
  });
});

describe('cartTotals', () => {
  it('counts units and sums the variant price times quantity', () => {
    const items = [line(1, 'A', 2, 10), line(2, 'B', 3, 5)];
    expect(cartTotals(items)).toEqual({ totalCount: 5, subtotal: 2 * 10 + 3 * 5 });
  });

  it('uses the product price for a line without a variant', () => {
    const noVariant = { product: product({ price: 7 }), quantity: 2 } as CartItem;
    expect(cartTotals([noVariant])).toEqual({ totalCount: 2, subtotal: 14 });
  });

  it('is zero for an empty cart', () => {
    expect(cartTotals([])).toEqual({ totalCount: 0, subtotal: 0 });
  });
});

describe('guestLinesToSync', () => {
  it('pushes guest lines the server does not hold', () => {
    const server = [line(1, 'A')];
    const guest = [line(2, 'B')];
    expect(guestLinesToSync(server, guest)).toEqual(guest);
  });

  it('keeps the server quantity for a line both carts hold', () => {
    const server = [line(1, 'A', 5)];
    const guest = [line(1, 'A', 2)];
    expect(guestLinesToSync(server, guest)).toEqual([]);
  });

  it('skips guest lines that have no variant id to send', () => {
    const guest = [{ product: product({ id: 3 }), quantity: 1 } as CartItem];
    expect(guestLinesToSync([], guest)).toEqual([]);
  });
});
