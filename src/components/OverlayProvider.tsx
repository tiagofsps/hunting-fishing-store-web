import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Product, ProductItem } from '../types';
import { OverlayContext } from './overlay-context';
import CartDrawer from './CartDrawer';
import QuickViewModal from '../features/home-page/components/QuickViewModal';
import AuthModal from '../features/auth/components/AuthModal';
import { useCart } from '../providers/useCart';
import { useAuth } from '../providers/useAuth';

export default function OverlayProvider({ children }: { children: React.ReactNode }) {
  const { cartItems, addToCart, updateQuantity, removeItem, clearCart } = useCart();
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const handleAddToCart = (product: Product, selectedItem?: ProductItem) => {
    addToCart(product, selectedItem);
    setIsCartOpen(true);
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    if (user) navigate('/checkout');
    else setIsAuthOpen(true);
  };

  return (
    <OverlayContext.Provider
      value={{
        isCartOpen,
        openCartDrawer: () => setIsCartOpen(true),
        closeCartDrawer: () => setIsCartOpen(false),
        isAuthOpen,
        openAuth: () => setIsAuthOpen(true),
        closeAuth: () => setIsAuthOpen(false),
        quickViewProduct,
        openQuickView: setQuickViewProduct,
        closeQuickView: () => setQuickViewProduct(null),
      }}
    >
      {children}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onOpenCheckout={handleOpenCheckout}
      />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={login}
        onRegister={register}
      />
    </OverlayContext.Provider>
  );
}