import type { CartItem, Product, ProductItem } from '../types';
import { getProductPrice } from '../utils';

export const CART_STORAGE_KEY = 'cart_items';

/**
 * A cart line is only orderable if it carries a `productItemId`. Quick-add
 * paths (e.g. the shop grid) pass no variant, so fall back to the first
 * orderable one. Lines already persisted before this rule existed are
 * normalised on load rather than being left unorderable.
 */
export function resolveVariant(selectedItem: ProductItem | undefined, product: Product): ProductItem | undefined {
  return selectedItem ?? product.items?.find((item) => item.active !== false && item.stockQuantity > 0);
}

/** Parses the guest cart from storage. Anything malformed yields an empty cart. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as CartItem[]).map((item) => ({
      ...item,
      selectedItem: resolveVariant(item.selectedItem, item.product),
    }));
  } catch {
    return [];
  }
}

/** A line is identified by product and variant SKU, so two variants of one product are separate lines. */
export function isSameLine(item: CartItem, productId: number, sku: string | undefined): boolean {
  return item.product.id === productId && item.selectedItem?.sku === sku;
}

/** Adds to the matching line, or appends a new one. Returns the resolved variant for the API call. */
export function addLine(
  items: CartItem[],
  product: Product,
  selectedItem: ProductItem | undefined,
  quantity: number
): { next: CartItem[]; variant: ProductItem | undefined } {
  const variant = resolveVariant(selectedItem, product);
  const sku = variant?.sku;
  const existing = items.find((i) => i.product.id === product.id && i.selectedItem?.sku === sku);
  const next = existing
    ? items.map((i) =>
        i.product.id === product.id && i.selectedItem?.sku === sku ? { ...i, quantity: i.quantity + quantity } : i
      )
    : [...items, { product, selectedItem: variant, quantity }];
  return { next, variant };
}

export function setLineQuantity(items: CartItem[], productId: number, sku: string | undefined, quantity: number): CartItem[] {
  return items.map((i) => (isSameLine(i, productId, sku) ? { ...i, quantity } : i));
}

export function removeLine(items: CartItem[], productId: number, sku: string | undefined): CartItem[] {
  return items.filter((i) => !isSameLine(i, productId, sku));
}

export function cartTotals(items: CartItem[]): { totalCount: number; subtotal: number } {
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => {
    const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
    return acc + price * item.quantity;
  }, 0);
  return { totalCount, subtotal };
}

/**
 * Guest lines that still need pushing to the server on login: those with a
 * variant id that the server cart does not already hold. Server quantities win.
 */
export function guestLinesToSync(serverItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const onServer = new Set(serverItems.map((item) => item.selectedItem?.id));
  return guestItems.filter((guest) => {
    const productItemId = guest.selectedItem?.id;
    return productItemId !== undefined && !onServer.has(productItemId);
  });
}
