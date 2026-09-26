import { Link } from 'react-router';
import type { Product, ProductItem, Promotion } from '../types';
import {
  getProductPrice,
  getProductImageUrl,
  getProductStock,
  formatCurrency,
  getSalePercentage,
  getSalePrice,
} from '../utils';
import { useLanguage } from '../i18n/useLanguage';

interface ProductCardProps {
  product: Product;
  promotions?: Promotion[];
  onAddToCart: (product: Product, selectedItem?: ProductItem) => void;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, promotions = [], onAddToCart, onQuickView }: ProductCardProps) {
  const { t } = useLanguage();

  const price = getProductPrice(product);
  const imageUrl = getProductImageUrl(product);
  const stock = getProductStock(product);
  const salePercentage = getSalePercentage(product, promotions);
  const salePrice = getSalePrice(product, promotions);

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-border bg-surface-raised p-4 transition-all duration-300 hover:border-accent-border hover:shadow-xl">
      <div>
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface border border-border/50">
          <Link to={`/product/${product.id}`} aria-label={product.name}>
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
            {salePercentage > 0 && (
              <span className="rounded-full bg-sale px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                {t('prod.sale').replace('{pct}', String(salePercentage))}
              </span>
            )}
            {product.requiresLicense && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                {t('prod.licenseRequired')}
              </span>
            )}
            {stock > 0 && stock <= 10 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow">
                {t('prod.lastUnits')}
              </span>
            )}
            {stock === 0 && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                {t('prod.soldOut')}
              </span>
            )}
          </div>

          {/* Quick View Floating Button */}
          <button
            onClick={() => onQuickView(product)}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur-sm opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-ink hover:text-white"
            title={t('prod.quickView')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* Product Info */}
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>ID: #{product.id}</span>
            {stock > 0 && <span className="text-accent-strong">{stock} {t('prod.inStock')}</span>}
          </div>

          <Link
            to={`/product/${product.id}`}
            className="mt-1.5 block text-base font-bold text-ink group-hover:text-accent-strong transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </Link>

          <p className="mt-1 text-xs text-body line-clamp-2 leading-relaxed">
            {product.description || t('prod.fallbackDescription')}
          </p>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            {salePrice !== null ? (
              <>
                <span className="text-xl font-black text-sale">{formatCurrency(salePrice)}</span>
                <span className="text-sm font-bold text-muted line-through">{formatCurrency(price)}</span>
              </>
            ) : (
              <span className="text-xl font-black text-ink">{formatCurrency(price)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="mt-5 pt-3 border-t border-border">
        <button
          disabled={stock === 0}
          onClick={() => onAddToCart(product)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {stock === 0 ? t('prod.unavailable') : t('prod.addToCart')}
        </button>
      </div>
    </div>
  );
}