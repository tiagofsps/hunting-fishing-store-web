import { createContext } from 'react';
import type { CartItem, Product, ProductItem } from '../types';

export interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (product: Product, selectedItem?: ProductItem, quantity?: number) => void;
  updateQuantity: (productId: number, itemSku: string | undefined, delta: number) => void;
  removeItem: (productId: number, itemSku?: string) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);