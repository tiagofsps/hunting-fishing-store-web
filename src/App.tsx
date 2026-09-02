import { useState } from 'react';
import Navbar from './components/navbar';
import CartDrawer from './components/CartDrawer';
import HeroSection from './features/home-page/components/HeroSection';
import ValuePropsSection from './features/home-page/components/ValuePropsSection';
import ProductSection from './features/home-page/components/ProductSection';
import QuickViewModal from './features/home-page/components/QuickViewModal';
import BrandSection from './features/home-page/components/BrandSection';
import PromotionBanner from './features/home-page/components/PromotionBanner';
import CTASection from './features/home-page/components/CTASection';
import Footer from './components/footer';
import { useHomeData } from './features/home-page/hooks';
import type { Product, ProductItem, CartItem } from './features/home-page/types';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const { products, categories, brands, promotions, loading, error } = useHomeData();

  // Interactive States
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cart Actions
  const handleAddToCart = (product: Product, selectedItem?: ProductItem) => {
    const sku = selectedItem?.sku;
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedItem?.sku === sku
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { product, selectedItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: number, itemSku: string | undefined, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.selectedItem?.sku === itemSku) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: number, itemSku?: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.selectedItem?.sku === itemSku))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <PromotionBanner promotions={promotions} />
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
              <p className="mt-2 text-xs text-muted">Verify backend API connection at http://localhost:8080</p>
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
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}


