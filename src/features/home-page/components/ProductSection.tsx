import { useState, useMemo } from 'react';
import type { Product, Category, ProductItem } from '../types';
import { getProductPrice, getProductImageUrl, getProductStock, formatCurrency } from '../utils';
import { useLanguage } from '../../../i18n/LanguageContext';

interface ProductSectionProps {
  products: Product[];
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  searchQuery: string;
  onAddToCart: (product: Product, selectedItem?: ProductItem) => void;
  onQuickView: (product: Product) => void;
}

export default function ProductSection({
  products,
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onAddToCart,
  onQuickView,
}: ProductSectionProps) {
  const { t } = useLanguage();
  const [sortOption, setSortOption] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategoryId !== null && product.categoryId !== selectedCategoryId) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(query);
        const descMatch = product.description?.toLowerCase().includes(query) ?? false;
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'price-asc') return getProductPrice(a) - getProductPrice(b);
      if (sortOption === 'price-desc') return getProductPrice(b) - getProductPrice(a);
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, selectedCategoryId, searchQuery, sortOption]);

  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

  return (
    <section id="featured" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Header & Controls */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">
                {t('prod.subtitle')}
              </span>
              {selectedCategoryName && (
                <span className="rounded-full bg-accent/20 px-3 py-0.5 text-xs font-bold text-ink">
                  {selectedCategoryName}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">
              {t('prod.title')}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 bg-surface-raised p-1.5 rounded-2xl border border-border">
              <button
                onClick={() => onSelectCategory(null)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedCategoryId === null
                    ? 'bg-ink text-white shadow'
                    : 'text-body hover:text-ink'
                }`}
              >
                {t('prod.allPill')} ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(selectedCategoryId === cat.id ? null : cat.id)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    selectedCategoryId === cat.id
                      ? 'bg-ink text-white shadow'
                      : 'text-body hover:text-ink'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="h-10 rounded-xl border border-border bg-surface-raised px-3 text-xs font-bold text-ink outline-none focus:border-accent-border cursor-pointer"
            >
              <option value="default">{t('prod.sortDefault')}</option>
              <option value="price-asc">{t('prod.sortPriceAsc')}</option>
              <option value="price-desc">{t('prod.sortPriceDesc')}</option>
              <option value="name">{t('prod.sortName')}</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-surface-raised border border-border mt-10">
            <svg className="mx-auto h-12 w-12 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-bold text-ink">{t('prod.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('prod.emptyDesc')}</p>
            <button
              onClick={() => {
                onSelectCategory(null);
              }}
              className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
            >
              {t('prod.clearFilters')}
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const price = getProductPrice(product);
              const imageUrl = getProductImageUrl(product);
              const stock = getProductStock(product);

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border bg-surface-raised p-4 transition-all duration-300 hover:border-accent-border hover:shadow-xl"
                >
                  <div>
                    {/* Product Image Container */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface border border-border/50">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Badges */}
                      <div className="absolute left-3 top-3 flex flex-col gap-1.5 items-start">
                        {product.requiresLicense && (
                          <span className="rounded-full bg-sale px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
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

                      <h3
                        onClick={() => onQuickView(product)}
                        className="mt-1.5 text-base font-bold text-ink group-hover:text-accent-strong transition-colors cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-body line-clamp-2 leading-relaxed">
                        {product.description || 'Pro gear for fishing and hunting with premium quality guarantee.'}
                      </p>

                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-xl font-black text-ink">{formatCurrency(price)}</span>
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
            })}
          </div>
        )}
      </div>
    </section>
  );
}


