import { createContext, useContext } from 'react';
import type { Product } from '../types';

export interface OverlayContextValue {
  isCartOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

export const OverlayContext = createContext<OverlayContextValue | undefined>(undefined);

export function useOverlays(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlays must be used within an OverlayProvider');
  return ctx;
}