import { useState, useEffect } from 'react';
import type { CartItem, Product, ProductItem } from '../types';
import { getProductPrice } from '../utils';
import * as api from '../features/cart/api';
import { CartContext } from './CartContext';

const STORAGE_KEY = 'cart_items';

/**
 * A cart line is only orderable if it carries a `productItemId`. Quick-add
 * paths (e.g. the shop grid) pass no variant, so fall back to the first
 * orderable one. Lines already persisted before this rule existed are
 * normalised on load rather than being left unorderable.
 */
function resolveVariant(selectedItem: ProductItem | undefined, product: Product): ProductItem | undefined {
  return selectedItem ?? product.items?.find((item) => item.active !== false && item.stockQuantity > 0);
}

function loadLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
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

function saveLocalCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Split cart: guests keep a localStorage-only cart; logged-in users get a
 * server-backed cart (loaded via GET /carts/{userId}) that is the display and
 * checkout source of truth. Guest items are merged into the server cart once
 * on login (absolute PUT quantities, so re-login never duplicates), then the
 * guest storage is cleared. Logout starts a clean, empty guest cart.
 */
export default function CartProvider({
  userId,
  children,
}: {
  userId: number | null;
  children: React.ReactNode;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    userId === null ? loadLocalCart() : []
  );

  // Load the right cart for the current scope: localStorage for guests, the
  // server cart (merged with any guest items) for logged-in users.
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (userId === null) {
        // Guest scope: hydrate from localStorage. After a logout the storage is
        // empty (cleared on login, never written while logged in), so this
        // yields a clean empty guest cart.
        const items = loadLocalCart();
        await Promise.resolve();
        if (!cancelled) setCartItems(items);
        return;
      }

      // Logged-in scope: never show guest items as the user's cart while the
      // server cart loads.
      await Promise.resolve();
      if (!cancelled) setCartItems([]);

      try {
        const resp = await api.getCart(userId);
        if (cancelled) return;

        const serverItems = api.cartResponseToItems(resp);
        const serverByProductItemId = new Map(
          serverItems.map((item) => [item.selectedItem?.id, item])
        );

        // Merge guest items into the server cart exactly once. Items already on
        // the server keep the server quantity; new ones are pushed with an
        // absolute PUT (idempotent, so a re-run cannot duplicate them).
        const merged = [...serverItems];
        const guestItems = loadLocalCart();
        for (const guest of guestItems) {
          const productItemId = guest.selectedItem?.id;
          if (productItemId === undefined) continue;
          if (serverByProductItemId.has(productItemId)) continue;
          try {
            await api.updateQuantity(userId, productItemId, guest.quantity);
            if (cancelled) return;
            merged.push(guest);
          } catch {
            // Server rejected the item (e.g. insufficient stock); skip it.
          }
        }

        if (cancelled) return;
        setCartItems(merged);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Server unreachable: leave the cart empty rather than showing stale
        // guest items as the user's cart.
        if (!cancelled) setCartItems([]);
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addToCart = (product: Product, selectedItem?: ProductItem, quantity = 1) => {
    const variant = resolveVariant(selectedItem, product);
    const sku = variant?.sku;
    const existing = cartItems.find((i) => i.product.id === product.id && i.selectedItem?.sku === sku);
    if (userId !== null && variant) {
      api.addToCart(userId, variant.id, quantity).catch(() => {});
    }
    const next = existing
      ? cartItems.map((i) =>
          i.product.id === product.id && i.selectedItem?.sku === sku ? { ...i, quantity: i.quantity + quantity } : i
        )
      : [...cartItems, { product, selectedItem: variant, quantity }];
    setCartItems(next);
    if (userId === null) saveLocalCart(next);
  };

  const updateQuantity = (productId: number, itemSku: string | undefined, delta: number) => {
    const item = cartItems.find((i) => i.product.id === productId && i.selectedItem?.sku === itemSku);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      if (userId !== null && item.selectedItem) {
        api.removeFromCart(userId, item.selectedItem.id).catch(() => {});
      }
      const next = cartItems.filter((i) => !(i.product.id === productId && i.selectedItem?.sku === itemSku));
      setCartItems(next);
      if (userId === null) saveLocalCart(next);
    } else {
      if (userId !== null && item.selectedItem) {
        api.updateQuantity(userId, item.selectedItem.id, newQty).catch(() => {});
      }
      const next = cartItems.map((i) =>
        i.product.id === productId && i.selectedItem?.sku === itemSku ? { ...i, quantity: newQty } : i
      );
      setCartItems(next);
      if (userId === null) saveLocalCart(next);
    }
  };

  const removeItem = (productId: number, itemSku?: string) => {
    const item = cartItems.find((i) => i.product.id === productId && i.selectedItem?.sku === itemSku);
    if (userId !== null && item?.selectedItem) {
      api.removeFromCart(userId, item.selectedItem.id).catch(() => {});
    }
    const next = cartItems.filter((i) => !(i.product.id === productId && i.selectedItem?.sku === itemSku));
    setCartItems(next);
    if (userId === null) saveLocalCart(next);
  };

  const clearCart = () => {
    if (userId !== null) {
      api.clearCart(userId).catch(() => {});
    }
    setCartItems([]);
    if (userId === null) saveLocalCart([]);
  };

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
    return acc + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, updateQuantity, removeItem, clearCart, totalCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}