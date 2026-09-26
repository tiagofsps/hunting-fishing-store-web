import { useState } from 'react';
import type { Product, ProductItem } from '../types';
import { OverlayContext } from './overlay-context';
import CartDrawer from './CartDrawer';
import QuickViewModal from '../features/home-page/components/QuickViewModal';
import CheckoutModal from '../features/checkout/components/CheckoutModal';
import AuthModal from '../features/auth/components/AuthModal';
import { useCart } from '../features/cart/hooks';
import { useAuth } from '../features/auth/hooks';

export default function OverlayProvider({ children }: { children: React.ReactNode }) {
  const { cartItems, addToCart, updateQuantity, removeItem, clearCart } = useCart();
  const { user, login, register, updateUser } = useAuth();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const handleAddToCart = (product: Product, selectedItem?: ProductItem) => {
    addToCart(product, selectedItem);
    setIsCartOpen(true);
  };

  const handleOpenCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
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
        isCheckoutOpen,
        openCheckout: () => setIsCheckoutOpen(true),
        closeCheckout: () => setIsCheckoutOpen(false),
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

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        currentUser={user}
        onOrderCompleted={clearCart}
        onRequireLogin={() => {
          setIsCheckoutOpen(false);
          setIsAuthOpen(true);
        }}
        onUserUpdated={updateUser}
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