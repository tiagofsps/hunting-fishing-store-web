import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { useHomeData } from './hooks';

const product = {
  id: 1,
  name: 'Rod',
  slug: 'rod',
  description: '',
  translations: null,
  requiresLicense: false,
  licenseType: null,
  categoryId: 3,
  brandId: 7,
  items: [],
  images: [],
};

function installData() {
  let productPageRequests = 0;
  server.use(
    http.get('/api/v1/products', ({ request }) => {
      productPageRequests += 1;
      expect(new URL(request.url).searchParams.get('size')).toBe('8');
      return HttpResponse.json({ content: [product], totalElements: 1, totalPages: 1, number: 0, size: 8, first: true, last: true, empty: false });
    }),
    http.get('/api/v1/categories', () => HttpResponse.json([{ id: 3, name: 'Rods', slug: 'rods', description: '', translations: null, parentCategoryId: null, productCount: 1 }])),
    http.get('/api/v1/brands', () => HttpResponse.json([{ id: 7, name: 'Acme', slug: 'acme', logoUrl: '' }])),
    http.get('/api/v1/promotions', () => HttpResponse.json([]))
  );
  return () => productPageRequests;
}

describe('useHomeData', () => {
  it('loads the featured product page and landing-page reference data', async () => {
    const productPageRequests = installData();
    const { result } = renderHook(() => useHomeData(), { wrapper: createProvidersWrapper() });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toMatchObject([{ id: 1, name: 'Rod' }]);
    expect(result.current.categories).toMatchObject([{ id: 3, name: 'Rods' }]);
    expect(result.current.brands).toMatchObject([{ id: 7, name: 'Acme' }]);
    expect(result.current.promotions).toEqual([]);
    expect(productPageRequests()).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error if any required home data fails', async () => {
    server.use(
      http.get('/api/v1/products', () => HttpResponse.json({ content: [] })),
      http.get('/api/v1/categories', () => HttpResponse.json([])),
      http.get('/api/v1/brands', () => HttpResponse.error()),
      http.get('/api/v1/promotions', () => HttpResponse.json([]))
    );

    const { result } = renderHook(() => useHomeData(), { wrapper: createProvidersWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.products).toEqual([]);
  });
});
