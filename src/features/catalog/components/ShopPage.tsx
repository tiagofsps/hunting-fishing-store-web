import { useState } from 'react';
import ProductCard from '../../../components/ProductCard';
import { useCart } from '../../../providers/useCart';
import { useOverlays } from '../../../components/overlay-context';
import { useCatalog } from '../hooks';
import type { CatalogSort } from '../types';
import type { Product, ProductItem } from '../../../types';
import { localizedText } from '../../../i18n/localizedContent';
import { useLanguage } from '../../../i18n/useLanguage';
import { Spinner } from '../../../components/ui/Spinner';

const SORT_OPTIONS: CatalogSort[] = ['default', 'price-asc', 'price-desc', 'name'];

function sortLabelKey(sort: CatalogSort): string {
  if (sort === 'price-asc') return 'shop.sortPriceAsc';
  if (sort === 'price-desc') return 'shop.sortPriceDesc';
  if (sort === 'name') return 'shop.sortName';
  return 'shop.sortDefault';
}

export default function ShopPage() {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { openCartDrawer, openQuickView } = useOverlays();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const {
    products,
    categories,
    brands,
    promotions,
    loading,
    error,
    totalElements,
    totalPages,
    currentPage,
    searchInput,
    query,
    hasActiveFilters,
    setSearchInput,
    submitSearch,
    selectCategory,
    selectBrand,
    changeSort,
    goToPage,
    clearFilters,
    reload,
  } = useCatalog();

  const handleAddToCart = (product: Product, selectedItem?: ProductItem) => {
    addToCart(product, selectedItem);
    openCartDrawer();
  };

  const resultLabel =
    totalElements === 1 ? t('shop.resultSingle') : t('shop.results').replace('{count}', String(totalElements));

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">{t('shop.categories')}</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => selectCategory(null)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors ${
                query.categoryId === null ? 'bg-ink text-white' : 'text-body hover:bg-surface-hover hover:text-ink'
              }`}
            >
              {t('shop.allCategories')}
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => selectCategory(category.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors ${
                  query.categoryId === category.id ? 'bg-ink text-white' : 'text-body hover:bg-surface-hover hover:text-ink'
                }`}
              >
                {localizedText(category, language).name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">{t('shop.brands')}</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => selectBrand(null)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors ${
                query.brandId === null ? 'bg-ink text-white' : 'text-body hover:bg-surface-hover hover:text-ink'
              }`}
            >
              {t('shop.allBrands')}
            </button>
          </li>
          {brands.map((brand) => (
            <li key={brand.id}>
              <button
                onClick={() => selectBrand(brand.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition-colors ${
                  query.brandId === brand.id ? 'bg-ink text-white' : 'text-body hover:bg-surface-hover hover:text-ink'
                }`}
              >
                {brand.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
        >
          {t('shop.clearFilters')}
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <header className="border-b border-border pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('shop.subtitle')}</span>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">{t('shop.title')}</h1>
            <span className="text-sm font-bold text-muted">{resultLabel}</span>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
          {/* Filters */}
          <aside>
            <button
              onClick={() => setIsFiltersOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-raised px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink lg:hidden"
              aria-expanded={isFiltersOpen}
            >
              {isFiltersOpen ? t('shop.hideFilters') : t('shop.showFilters')}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {isFiltersOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className={`mt-4 lg:mt-0 lg:block ${isFiltersOpen ? 'block' : 'hidden'}`}>{filterPanel}</div>
          </aside>

          {/* Results */}
          <div>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="flex h-11 flex-1 items-center gap-2 rounded-full border border-border bg-surface-raised px-4 text-muted focus-within:border-accent-border">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('shop.searchPlaceholder')}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-placeholder"
                />
              </form>

              <label className="flex items-center gap-2 text-xs font-bold text-muted">
                <span className="hidden sm:inline">{t('shop.sortLabel')}</span>
                <select
                  value={query.sort}
                  onChange={(e) => changeSort(e.target.value as CatalogSort)}
                  className="h-11 rounded-full border border-border bg-surface-raised px-4 text-xs font-bold text-ink outline-none focus:border-accent-border cursor-pointer"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(sortLabelKey(option))}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Grid / states */}
            {loading ? (
              <div className="flex h-80 flex-col items-center justify-center gap-4">
                <Spinner />
                <p className="text-sm font-bold text-muted">{t('shop.loading')}</p>
              </div>
            ) : error ? (
              <div className="mt-8 rounded-3xl border border-sale/30 bg-sale/10 p-8 text-center">
                <p className="font-bold text-sale">
                  {t('shop.errorTitle')} {error}
                </p>
                <button
                  onClick={reload}
                  className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
                >
                  {t('shop.retry')}
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-border bg-surface-raised p-12 text-center">
                <svg className="mx-auto mb-3 h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg font-bold text-ink">{t('shop.emptyTitle')}</p>
                <p className="mt-1 text-sm text-muted">{t('shop.emptyDesc')}</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
                  >
                    {t('shop.clearFilters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    promotions={promotions}
                    onAddToCart={handleAddToCart}
                    onQuickView={openQuickView}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('shop.previous')}
                </button>
                <span className="text-xs font-bold text-muted">
                  {t('shop.pageOf')
                    .replace('{current}', String(currentPage + 1))
                    .replace('{total}', String(totalPages))}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t('shop.next')}
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}