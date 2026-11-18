import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { ProductResponse } from '../../lib/catalogApi';
import { server } from '../../test/server';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { useCatalog } from './hooks';

const product = (id: number, price: number): ProductResponse => ({
  id,
  name: `Rod ${id}`,
  slug: `rod-${id}`,
  description: '',
  translations: null,
  requiresLicense: false,
  licenseType: null,
  categoryId: 1,
  brandId: 2,
  items: [{ id: id * 10, sku: `SKU-${id}`, price, stockQuantity: 5, weight: null, active: true, attributes: {} }],
  images: [],
});

const page = (content: ProductResponse[]) => ({
  content,
  totalElements: content.length,
  totalPages: 3,
  number: 0,
  size: 20,
  first: true,
  last: false,
  empty: content.length === 0,
});

function installReferenceData() {
  server.use(
    http.get('/api/v1/categories', () => HttpResponse.json([{ id: 1, name: 'Rods', slug: 'rods', description: '', translations: null, parentCategoryId: null, productCount: 2 }])),
    http.get('/api/v1/brands', () => HttpResponse.json([{ id: 2, name: 'Acme', slug: 'acme', logoUrl: '' }])),
    http.get('/api/v1/promotions', () => HttpResponse.json([]))
  );
}

describe('useCatalog', () => {
  it('loads products and reference data, then settles loading', async () => {
    installReferenceData();
    server.use(http.get('/api/v1/products', () => HttpResponse.json(page([product(1, 20)]))));
    const { result } = renderHook(() => useCatalog(), { wrapper: createProvidersWrapper() });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toMatchObject([{ id: 1, name: 'Rod 1' }]);
    expect(result.current.categories).toMatchObject([{ id: 1, name: 'Rods' }]);
    expect(result.current.brands).toMatchObject([{ id: 2, name: 'Acme' }]);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('keeps the grid usable when optional filter reference data fails', async () => {
    server.use(
      http.get('/api/v1/categories', () => HttpResponse.error()),
      http.get('/api/v1/brands', () => HttpResponse.json([])),
      http.get('/api/v1/promotions', () => HttpResponse.json([])),
      http.get('/api/v1/products', () => HttpResponse.json(page([product(1, 20)])))
    );

    const { result } = renderHook(() => useCatalog(), { wrapper: createProvidersWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.categories).toEqual([]);
  });

  it('surfaces a product request failure and can retry', async () => {
    installReferenceData();
    let calls = 0;
    server.use(
      http.get('/api/v1/products', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ message: 'Catalog unavailable' }, { status: 503 })
          : HttpResponse.json(page([product(2, 30)]));
      })
    );

    const { result } = renderHook(() => useCatalog(), { wrapper: createProvidersWrapper() });
    await waitFor(() => expect(result.current.error).toBe('Catalog unavailable'));
    expect(result.current.products).toEqual([]);

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.products).toMatchObject([{ id: 2 }]));
    expect(result.current.error).toBeNull();
  });

  it('sorts by price on the current page without asking the backend for price sort', async () => {
    installReferenceData();
    const seen: URL[] = [];
    server.use(
      http.get('/api/v1/products', ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json(page([product(1, 30), product(2, 10), product(3, 20)]));
      })
    );

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createProvidersWrapper({ route: '/shop?sort=price-asc' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.products.map((p) => p.id)).toEqual([2, 3, 1]);
    expect(seen[0].searchParams.get('sort')).toBe('createdAt');
    expect(seen[0].searchParams.get('direction')).toBe('desc');
  });

  it('parses URL filters, marks them active, updates search and clears the page when filters change', async () => {
    installReferenceData();
    const urls: URL[] = [];
    server.use(http.get('/api/v1/products', ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json(page([]));
    }));

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createProvidersWrapper({ route: '/shop?q=rod&categoryId=1&page=2' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.query).toMatchObject({ q: 'rod', categoryId: 1, page: 2 });
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.setSearchInput('  reel  '));
    act(() => result.current.submitSearch());
    await waitFor(() => expect(result.current.query.q).toBe('reel'));
    expect(result.current.query.page).toBe(0);
    expect(urls.at(-1)?.searchParams.get('q')).toBe('reel');
  });

  it('changes category, brand, sort and page, preserving page only for pagination', async () => {
    installReferenceData();
    server.use(http.get('/api/v1/products', () => HttpResponse.json(page([]))));
    const { result } = renderHook(() => useCatalog(), {
      wrapper: createProvidersWrapper({ route: '/shop?page=2&brandId=2' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.goToPage(1));
    await waitFor(() => expect(result.current.query.page).toBe(1));
    act(() => result.current.selectCategory(1));
    await waitFor(() => expect(result.current.query.categoryId).toBe(1));
    expect(result.current.query.page).toBe(0);
    act(() => result.current.selectBrand(null));
    await waitFor(() => expect(result.current.query.brandId).toBeNull());
    act(() => result.current.changeSort('name'));
    await waitFor(() => expect(result.current.query.sort).toBe('name'));
    act(() => result.current.clearFilters());
    await waitFor(() => expect(result.current.query).toMatchObject({ q: '', categoryId: null, brandId: null, page: 0, sort: 'default' }));
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('uses the default sort for an unknown sort query and ignores invalid numeric filters', async () => {
    installReferenceData();
    const urls: URL[] = [];
    server.use(http.get('/api/v1/products', ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json(page([]));
    }));

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createProvidersWrapper({ route: '/shop?sort=arbitrary&page=-2&categoryId=NaN' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.query).toMatchObject({ sort: 'default', page: 0, categoryId: null });
    expect(urls[0].searchParams.get('sort')).toBe('createdAt');
    expect(urls[0].searchParams.get('direction')).toBe('desc');
  });
});
