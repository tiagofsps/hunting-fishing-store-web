import { useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../../../providers/useCart';
import { useOverlays } from '../../../components/overlay-context';
import { useProductDetail } from '../hooks';
import { getProductPrice, getProductImageUrl, getProductStock, formatCurrency, getSalePrice, getSalePercentage, formatImageUrl } from '../../../utils';
import { localizedText } from '../../../i18n/localizedContent';
import { useLanguage } from '../../../i18n/useLanguage';
import { Spinner } from '../../../components/ui/Spinner';

export default function ProductDetailPage() {
  const { language, t } = useLanguage();
  const { product, category, brand, promotions, loading, error, reload } = useProductDetail();
  const { addToCart } = useCart();
  const { openCartDrawer } = useOverlays();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variants = product?.items?.filter((item) => item.active !== false) ?? [];
  // A stale selection (e.g. after navigating to another product) falls back to the first option.
  const selectedItem = variants.find((item) => item.id === selectedItemId) ?? variants[0];

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner label={t('common.loading')} />
        <p className="text-sm font-bold text-muted">{t('pdp.loading')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{t('pdp.notFoundTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{error && error !== 'not_found' ? `${t('pdp.errorTitle')} ${error}` : t('pdp.notFoundDesc')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {error && error !== 'not_found' && (
            <button
              onClick={reload}
              className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
            >
              {t('pdp.retry')}
            </button>
          )}
          <Link
            to="/shop"
            className="rounded-xl border border-border bg-surface-raised px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
          >
            {t('pdp.backToShop')}
          </Link>
        </div>
      </div>
    );
  }

  // Route every image through formatImageUrl so backend-hosted assets use the
  // dev proxy, matching ProductCard and the shop grid.
  const images =
    product.images && product.images.length > 0
      ? product.images.map((img) => formatImageUrl(img.imageUrl) ?? getProductImageUrl(product))
      : [getProductImageUrl(product)];
  const activeImageIndex = Math.min(selectedImageIndex, Math.max(images.length - 1, 0));
  const displayPrice = selectedItem ? selectedItem.price : getProductPrice(product);
  const displayStock = selectedItem ? selectedItem.stockQuantity : getProductStock(product);
  const productText = localizedText(product, language);

  const salePercentage = getSalePercentage(product, promotions);
  const basePrice = getProductPrice(product);
  const salePrice = getSalePrice(product, promotions);
  const effectivePrice = selectedItem
    ? salePrice !== null
      ? Math.round(selectedItem.price * (1 - salePercentage / 100) * 100) / 100
      : selectedItem.price
    : (salePrice ?? basePrice);

  const maxQuantity = Math.max(displayStock, 1);
  const safeQuantity = Math.min(Math.max(1, quantity), maxQuantity);

  const handleAdd = () => {
    addToCart(product, selectedItem, safeQuantity);
    openCartDrawer();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-surface py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-muted" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-accent-strong">
            {t('pdp.breadcrumbHome')}
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/shop" className="hover:text-accent-strong">
            {t('pdp.breadcrumbShop')}
          </Link>
          {category && (
            <>
              <span aria-hidden="true">/</span>
              <Link to={`/shop?categoryId=${category.id}`} className="hover:text-accent-strong">
                {localizedText(category, language).name}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-ink">{productText.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface-raised">
              <img
                src={images[activeImageIndex] || getProductImageUrl(product)}
                alt={productText.name}
                className="h-full w-full object-cover"
              />
              {salePercentage > 0 && (
                <span className="absolute left-4 top-4 rounded-full bg-sale px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow">
                  {t('prod.sale').replace('{pct}', String(salePercentage))}
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((src, index) => (
                  <button
                    key={src + index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${
                      index === activeImageIndex ? 'border-accent-strong' : 'border-border hover:border-accent-border'
                    }`}
                    aria-label={`${t('pdp.gallery')} ${index + 1}`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-strong">
              {category && <span>{localizedText(category, language).name}</span>}
              {brand && <span>· {brand.name}</span>}
            </div>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{productText.name}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className={`text-3xl font-black ${salePrice !== null ? 'text-sale' : 'text-ink'}`}>
                {formatCurrency(effectivePrice)}
              </span>
              {salePrice !== null && (
                <span className="text-lg font-bold text-muted line-through">{formatCurrency(displayPrice)}</span>
              )}
              <span className="text-xs font-bold text-muted">{t('pdp.taxIncluded')}</span>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs font-bold">
              {displayStock > 0 ? (
                <span className="text-accent-strong">
                  {displayStock} {t('pdp.units')} · {t('pdp.inStock')}
                </span>
              ) : (
                <span className="text-sale">{t('pdp.soldOut')}</span>
              )}
              <span className="text-muted">
                {t('pdp.ref')} #{product.id}
              </span>
            </div>

            {product.requiresLicense && (
              <div className="mt-5 rounded-2xl border border-sale/30 bg-sale/10 p-4 text-xs font-bold text-sale">
                {t('pdp.licenseNotice')}
              </div>
            )}

            {variants.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('pdp.variantLabel')}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {variants.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setQuantity(1);
                      }}
                      className={`rounded-xl border px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                        selectedItemId === item.id
                          ? 'border-accent-strong bg-ink text-white'
                          : 'border-border bg-surface-raised text-body hover:border-accent-border hover:text-ink'
                      } ${item.stockQuantity === 0 ? 'opacity-50' : ''}`}
                    >
                      {item.sku ?? `#${item.id}`}
                      <span className="ml-2 font-normal opacity-80">{formatCurrency(item.price)}</span>
                      {item.stockQuantity === 0 && <span className="ml-2 font-normal">· {t('pdp.outOfStockVariant')}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-2">
                <span className="text-xs font-bold text-muted">{t('pdp.quantity')}</span>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={safeQuantity <= 1 || displayStock === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/5 text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="-"
                >
                  −
                </button>
                <span className="min-w-6 text-center text-sm font-black text-ink">{safeQuantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={safeQuantity >= maxQuantity || displayStock === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/5 text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="+"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={displayStock === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-8 py-4 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed min-w-48"
              >
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {displayStock === 0 ? t('pdp.soldOut') : added ? t('pdp.added') : t('pdp.addToCart')}
              </button>
            </div>

            {productText.description && (
              <div className="mt-10">
                <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('pdp.description')}</h2>
                <p className="mt-3 text-sm leading-relaxed text-body">{productText.description}</p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('pdp.details')}</h2>
              <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface-raised text-sm">
                {selectedItem?.sku && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="font-bold text-muted">{t('pdp.detailSku')}</dt>
                    <dd className="font-bold text-ink">{selectedItem.sku}</dd>
                  </div>
                )}
                {category && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="font-bold text-muted">{t('pdp.detailCategory')}</dt>
                    <dd className="font-bold text-ink">{localizedText(category, language).name}</dd>
                  </div>
                )}
                {brand && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="font-bold text-muted">{t('pdp.detailBrand')}</dt>
                    <dd className="font-bold text-ink">{brand.name}</dd>
                  </div>
                )}
                {selectedItem?.weight != null && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <dt className="font-bold text-muted">{t('pdp.detailWeight')}</dt>
                    <dd className="font-bold text-ink">{selectedItem.weight} kg</dd>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <dt className="font-bold text-muted">{t('pdp.detailStock')}</dt>
                  <dd className="font-bold text-ink">{displayStock}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
