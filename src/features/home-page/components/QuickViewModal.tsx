import { useState } from 'react';
import type { Product, ProductItem } from '../../../types';
import { getProductPrice, getProductImageUrl, getProductStock, formatCurrency } from '../../../utils';
import { localizedText } from '../../../i18n/localizedContent';
import { useLanguage } from '../../../i18n/useLanguage';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedItem?: ProductItem) => void;
}

export default function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  const { language, t } = useLanguage();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>(
    product?.items && product.items.length > 0 ? product.items[0].id : undefined
  );
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const productText = localizedText(product, language);
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.imageUrl)
    : [getProductImageUrl(product)];

  const currentImage = images[selectedImageIndex] || getProductImageUrl(product);
  const selectedItem = product.items?.find((i) => i.id === selectedItemId);

  const displayPrice = selectedItem ? selectedItem.price : getProductPrice(product);
  const displayStock = selectedItem ? selectedItem.stockQuantity : getProductStock(product);

  const handleAdd = () => {
    onAddToCart(product, selectedItem);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-surface-raised p-6 text-left shadow-2xl transition-all sm:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted hover:bg-surface-hover hover:text-ink transition-colors"
            aria-label={t('common.close')}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Gallery Column */}
            <div className="flex flex-col gap-4">
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface relative">
                <img
                  src={currentImage}
                  alt={productText.name}
                  className="h-full w-full object-cover"
                />
                {product.requiresLicense && (
                  <span className="absolute left-3 top-3 rounded-full bg-sale px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow">
                    {t('modal.licenseRequired')}
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx ? 'border-accent-strong scale-95' : 'border-border opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Column */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted border border-border">
                    ID: #{product.id}
                  </span>
                  {displayStock > 0 ? (
                    <span className="text-xs font-bold text-accent-strong flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent-strong animate-pulse"></span>
                      {t('modal.inStock')} ({displayStock} {t('modal.units')})
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-sale">{t('modal.soldOut')}</span>
                  )}
                </div>

                <h2 className="text-2xl font-black tracking-tight text-ink">{productText.name}</h2>
                <p className="mt-4 text-sm text-body leading-relaxed">
                  {productText.description || t('prod.fallbackDescription')}
                </p>

                {/* Items/Variants Selection */}
                {product.items && product.items.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-2">
                      {t('modal.variantLabel')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.items.map((item) => {
                        const isSelected = item.id === selectedItemId;
                        const label = item.attributes
                          ? Object.values(item.attributes).join(' - ')
                          : `SKU: ${item.sku}`;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-ink text-white border-ink shadow'
                                : 'bg-surface text-body border-border hover:border-accent-border'
                            }`}
                          >
                            {label} ({formatCurrency(item.price)})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-ink">{formatCurrency(displayPrice)}</span>
                  <span className="text-xs text-muted">{t('modal.taxIncluded')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                <button
                  disabled={displayStock === 0}
                  onClick={handleAdd}
                  className={`w-full rounded-2xl py-4 text-sm font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-accent text-ink scale-95'
                      : displayStock === 0
                      ? 'bg-muted text-white cursor-not-allowed'
                      : 'bg-ink text-white hover:bg-ink/90 active:scale-95'
                  }`}
                >
                  {added ? (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t('modal.addedToCart')}
                    </>
                  ) : displayStock === 0 ? (
                    t('prod.unavailable')
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {t('prod.addToCart')}
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted">
                  {t('modal.guarantee')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
