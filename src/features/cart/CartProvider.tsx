import { useState, useEffect, useRef } from 'react';
import type { CartItem, Product, ProductItem } from '../../types';
import { getProductPrice } from '../../utils';
import * as api from './api';
import { CartContext } from './context';

const STORAGE_KEY = 'cart_items';

function loadLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Hybrid cart: the client cart (with full product info) is the display source
 * of truth and is persisted to localStorage. When a user is logged in, every
 * mutation is also pushed to the server cart (best-effort) so checkout can use
 * the server-side cart. Guest items are pushed to the server on login.
 */
export default function CartProvider({
  userId,
  children,
}: {
  userId: number | null;
  children: React.ReactNode;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadLocalCart());
  const hasBeenGuestRef = useRef(false);

  // Persist to localStorage whenever the cart changes.
  useEffect(() => {
    saveLocalCart(cartItems);
  }, [cartItems]);

  // Push guest cart items to the server cart when a user logs in.
  useEffect(() => {
    if (userId === null) {
      hasBeenGuestRef.current = true;
      return;
    }
    if (!hasBeenGuestRef.current) return;
    hasBeenGuestRef.current = false;

    const currentUserId = userId;
    async function syncGuestCart() {
      const items = loadLocalCart();
      for (const item of items) {
        const productItemId = item.selectedItem?.id;
        if (productItemId === undefined) continue;
        try {
          await api.addToCart(currentUserId, productItemId, item.quantity);
        } catch {
          // best-effort sync; ignore per-item failures
        }
      }
    }
    syncGuestCart();
  }, [userId]);

  const addToCart = (product: Product, selectedItem?: ProductItem) => {
    const sku = selectedItem?.sku;
    const existing = cartItems.find((i) => i.product.id === product.id && i.selectedItem?.sku === sku);
    if (userId !== null && selectedItem) {
      api.addToCart(userId, selectedItem.id, 1).catch(() => {});
    }
    if (existing) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.product.id === product.id && i.selectedItem?.sku === sku ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCartItems((prev) => [...prev, { product, selectedItem, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, itemSku: string | undefined, delta: number) => {
    const item = cartItems.find((i) => i.product.id === productId && i.selectedItem?.sku === itemSku);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      if (userId !== null && item.selectedItem) {
        api.removeFromCart(userId, item.selectedItem.id).catch(() => {});
      }
      setCartItems((prev) => prev.filter((i) => !(i.product.id === productId && i.selectedItem?.sku === itemSku)));
    } else {
      if (userId !== null && item.selectedItem) {
        api.updateQuantity(userId, item.selectedItem.id, newQty).catch(() => {});
      }
      setCartItems((prev) =>
        prev.map((i) =>
          i.product.id === productId && i.selectedItem?.sku === itemSku ? { ...i, quantity: newQty } : i
        )
      );
    }
  };

  const removeItem = (productId: number, itemSku?: string) => {
    const item = cartItems.find((i) => i.product.id === productId && i.selectedItem?.sku === itemSku);
    if (userId !== null && item?.selectedItem) {
      api.removeFromCart(userId, item.selectedItem.id).catch(() => {});
    }
    setCartItems((prev) => prev.filter((i) => !(i.product.id === productId && i.selectedItem?.sku === itemSku)));
  };

  const clearCart = () => {
    if (userId !== null) {
      api.clearCart(userId).catch(() => {});
    }
    setCartItems([]);
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