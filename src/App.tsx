import { useState } from 'react';
import Navbar from './components/navbar';
import CartDrawer from './components/CartDrawer';
import HeroSection from './features/home-page/components/HeroSection';
import ValuePropsSection from './features/home-page/components/ValuePropsSection';
import ProductSection from './features/home-page/components/ProductSection';
import QuickViewModal from './features/home-page/components/QuickViewModal';
import CheckoutModal from './features/checkout/components/CheckoutModal';
import BrandSection from './features/home-page/components/BrandSection';
import PromotionBanner from './features/home-page/components/PromotionBanner';
import CTASection from './features/home-page/components/CTASection';
import Footer from './components/footer';
import AuthModal from './features/auth/components/AuthModal';
import { useHomeData } from './features/home-page/hooks';
import { useAuth } from './features/auth/hooks';
import { useCart } from './features/cart/hooks';
import type { Product, ProductItem } from './types';
import { useLanguage } from './i18n/useLanguage';

export default function App() {
  const { t } = useLanguage();
  const { products, categories, brands, promotions, loading, error } = useHomeData();
  const { user, login, register, logout, updateUser } = useAuth();
  const { cartItems, addToCart, updateQuantity, removeItem, clearCart, totalCount } = useCart(user?.id ?? null);

  // Interactive States
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
    <div className="min-h-screen bg-surface text-ink antialiased">
      <PromotionBanner promotions={promotions} />
      <Navbar
        cartCount={totalCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={logout}
      />

      <main>
        <HeroSection />

        <ValuePropsSection />

        {loading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-strong border-t-transparent"></div>
            <p className="text-sm font-bold text-muted">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl px-5 py-24 text-center">
            <div className="rounded-3xl border border-sale/30 bg-sale/10 p-8">
              <p className="font-bold text-sale">{t('common.errorTitle')} {error}</p>
              <p className="mt-2 text-xs text-muted">{t('common.backendError')}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <ProductSection
              products={products}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
            />

            <BrandSection brands={brands} />
          </>
        )}

        <CTASection />
      </main>

      <Footer />

      {/* Cart Drawer Slide-over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Modal */}
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={login}
        onRegister={register}
      />
    </div>
  );
}