import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import * as catalogApi from '../../lib/catalogApi';
import { getProductPrice } from '../../utils';
import type { Product, Category, Brand, Promotion, Page } from '../../types';
import type { CatalogSort, ServerSort, SortDirection } from './types';
import { useLanguage } from '../../i18n/useLanguage';

export const CATALOG_PAGE_SIZE = 20;

const EMPTY_PAGE: Page<Product> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: CATALOG_PAGE_SIZE,
  first: true,
  last: true,
  empty: true,
};

function toNumber(raw: string | null): number | null {
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toSort(raw: string | null): CatalogSort {
  return raw === 'price-asc' || raw === 'price-desc' || raw === 'name' ? raw : 'default';
}

/** The backend only sorts by name/createdAt, so price sorting is applied per page. */
function resolveServerSort(sort: CatalogSort): { sort: ServerSort; direction: SortDirection } {
  if (sort === 'name') return { sort: 'name', direction: 'asc' };
  return { sort: 'createdAt', direction: 'desc' };
}

export function useCatalog() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const categoryId = toNumber(searchParams.get('categoryId'));
  const brandId = toNumber(searchParams.get('brandId'));
  const sort = toSort(searchParams.get('sort'));
  const page = toNumber(searchParams.get('page')) ?? 0;

  const [searchInput, setSearchInput] = useState(q);
  const [result, setResult] = useState<Page<Product>>(EMPTY_PAGE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // Filter reference data is stable, so it is fetched once.
  useEffect(() => {
    let cancelled = false;
    Promise.all([catalogApi.getCategories(), catalogApi.getBrands(), catalogApi.getPromotions()])
      .then(([c, b, p]) => {
        if (cancelled) return;
        setCategories(c);
        setBrands(b);
        setPromotions(p);
      })
      .catch(() => {
        // filter data is non-critical; the product grid still renders
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        const serverSort = resolveServerSort(sort);
        const data = await catalogApi.getProductsPage({
          page,
          size: CATALOG_PAGE_SIZE,
          categoryId: categoryId ?? undefined,
          brandId: brandId ?? undefined,
          q: q || undefined,
          sort: serverSort.sort,
          direction: serverSort.direction,
        });
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [page, categoryId, brandId, q, sort, language, reloadToken]);

  const products = useMemo(() => {
    if (sort !== 'price-asc' && sort !== 'price-desc') return result.content;
    const content = [...result.content];
    return content.sort((a, b) =>
      sort === 'price-asc' ? getProductPrice(a) - getProductPrice(b) : getProductPrice(b) - getProductPrice(a)
    );
  }, [result.content, sort]);

  const updateQuery = useCallback(
    (next: Record<string, string | number | null>, keepPage = false) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === '') params.delete(key);
        else params.set(key, String(value));
      }
      if (!keepPage) params.delete('page');
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const submitSearch = useCallback(() => {
    updateQuery({ q: searchInput.trim() || null });
  }, [updateQuery, searchInput]);

  const selectCategory = useCallback((id: number | null) => updateQuery({ categoryId: id }), [updateQuery]);
  const selectBrand = useCallback((id: number | null) => updateQuery({ brandId: id }), [updateQuery]);
  const changeSort = useCallback((value: CatalogSort) => updateQuery({ sort: value === 'default' ? null : value }), [updateQuery]);
  const goToPage = useCallback((value: number) => updateQuery({ page: value }, true), [updateQuery]);
  const clearFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams({});
  }, [setSearchParams]);

  const hasActiveFilters = q !== '' || categoryId !== null || brandId !== null;

  return {
    products,
    categories,
    brands,
    promotions,
    loading,
    error,
    totalElements: result.totalElements,
    totalPages: result.totalPages,
    currentPage: page,
    searchInput,
    query: { q, categoryId, brandId, sort, page },
    hasActiveFilters,
    setSearchInput,
    submitSearch,
    selectCategory,
    selectBrand,
    changeSort,
    goToPage,
    clearFilters,
    reload,
  };
}