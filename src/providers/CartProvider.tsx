import { useState, useEffect } from 'react';
import type { CartItem, Product, ProductItem } from '../types';
import * as api from '../features/cart/api';
import { CartContext } from './CartContext';
import {
  CART_STORAGE_KEY,
  addLine,
  cartTotals,
  guestLinesToSync,
  parseStoredCart,
  removeLine,
  setLineQuantity,
} from './cartState';

function loadLocalCart(): CartItem[] {
  return parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
}

function saveLocalCart(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

/**
 * Split cart: guests keep a localStorage-only cart; logged-in users get a
 * server-backed cart (loaded via GET /carts/{userId}) that is the display and
 * checkout source of truth. Guest items are merged into the server cart once
 * on login (absolute PUT quantities, so re-login never duplicates), then the
 * guest storage is cleared. Logout starts a clean, empty guest cart.
 *
 * The line arithmetic lives in cartState.ts; this component owns state, effects
 * and the API calls.
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);

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
        if (!cancelled) {
          setCartItems(items);
          setIsLoading(false);
          setLoadedUserId(null);
        }
        return;
      }

      // Logged-in scope: never show guest items as the user's cart while the
      // server cart loads.
      await Promise.resolve();
      if (!cancelled) {
        setCartItems([]);
        setIsLoading(true);
      }

      try {
        const resp = await api.getCart(userId);
        if (cancelled) return;

        const serverItems = api.cartResponseToItems(resp);

        // Merge guest items into the server cart exactly once. Items already on
        // the server keep the server quantity; new ones are pushed with an
        // absolute PUT (idempotent, so a re-run cannot duplicate them).
        const merged = [...serverItems];
        for (const guest of guestLinesToSync(serverItems, loadLocalCart())) {
          try {
            await api.updateQuantity(userId, guest.selectedItem!.id, guest.quantity);
            if (cancelled) return;
            merged.push(guest);
          } catch {
            // Server rejected the item (e.g. insufficient stock); skip it.
          }
        }

        if (cancelled) return;
        setCartItems(merged);
        localStorage.removeItem(CART_STORAGE_KEY);
        setIsLoading(false);
        setLoadedUserId(userId);
      } catch {
        // Server unreachable: leave the cart empty rather than showing stale
        // guest items as the user's cart.
        if (!cancelled) {
          setCartItems([]);
          setIsLoading(false);
          setLoadedUserId(userId);
        }
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const commit = (next: CartItem[]) => {
    setCartItems(next);
    if (userId === null) saveLocalCart(next);
  };

  const addToCart = (product: Product, selectedItem?: ProductItem, quantity = 1) => {
    const { next, variant } = addLine(cartItems, product, selectedItem, quantity);
    if (userId !== null && variant) {
      api.addToCart(userId, variant.id, quantity).catch(() => {});
    }
    commit(next);
  };

  const updateQuantity = (productId: number, itemSku: string | undefined, delta: number) => {
    const item = cartItems.find((i) => i.product.id === productId && i.selectedItem?.sku === itemSku);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      if (userId !== null && item.selectedItem) {
        api.removeFromCart(userId, item.selectedItem.id).catch(() => {});
      }
      commit(removeLine(cartItems, productId, itemSku));
    } else {
      if (userId !== null && item.selectedItem) {
        api.updateQuantity(userId, item.selectedItem.id, newQty).catch(() => {});
      }
      commit(setLineQuantity(cartItems, productId, itemSku, newQty));
    }
  };

  const removeItem = (productId: number, itemSku?: string) => {
    const item = cartItems.find((i) => i.product.id === productId && i.selectedItem?.sku === itemSku);
    if (userId !== null && item?.selectedItem) {
      api.removeFromCart(userId, item.selectedItem.id).catch(() => {});
    }
    commit(removeLine(cartItems, productId, itemSku));
  };

  const clearCart = () => {
    if (userId !== null) {
      api.clearCart(userId).catch(() => {});
    }
    commit([]);
  };

  const { totalCount, subtotal } = cartTotals(cartItems);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading: userId !== null && (isLoading || loadedUserId !== userId),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
