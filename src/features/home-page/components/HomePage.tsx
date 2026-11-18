import HeroSection from './HeroSection';
import ValuePropsSection from './ValuePropsSection';
import ProductSection from './ProductSection';
import BrandSection from './BrandSection';
import CTASection from './CTASection';
import { useHomeData } from '../hooks';
import { useCart } from '../../../providers/useCart';
import { useOverlays } from '../../../components/overlay-context';
import type { Product, ProductItem } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';
import { Spinner } from '../../../components/ui/Spinner';

export default function HomePage() {
  const { t } = useLanguage();
  const { products, brands, promotions, loading, error } = useHomeData();
  const { addToCart } = useCart();
  const { openCartDrawer, openQuickView } = useOverlays();

  const handleAddToCart = (product: Product, selectedItem?: ProductItem) => {
    addToCart(product, selectedItem);
    openCartDrawer();
  };

  return (
    <>
      <HeroSection />

      <ValuePropsSection />

      {loading ? (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <Spinner label={t('common.loading')} />
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
            promotions={promotions}
            onAddToCart={handleAddToCart}
            onQuickView={openQuickView}
          />

          <BrandSection brands={brands} />
        </>
      )}

      <CTASection />
    </>
  );
}
