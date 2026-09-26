import { useState, useMemo } from 'react';
import type { Product, Category, ProductItem, Promotion } from '../../../types';
import { getProductPrice } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import ProductCard from '../../../components/ProductCard';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name';

interface ProductSectionProps {
  products: Product[];
  categories: Category[];
  promotions?: Promotion[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  searchQuery: string;
  onAddToCart: (product: Product, selectedItem?: ProductItem) => void;
  onQuickView: (product: Product) => void;
}

export default function ProductSection({
  products,
  categories,
  promotions = [],
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onAddToCart,
  onQuickView,
}: ProductSectionProps) {
  const { t } = useLanguage();
  const [sortOption, setSortOption] = useState<SortOption>('default');

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
              onChange={(e) => setSortOption(e.target.value as SortOption)}
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
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                promotions={promotions}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}