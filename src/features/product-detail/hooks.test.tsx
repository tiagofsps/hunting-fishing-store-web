import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { useProductDetail } from './hooks';

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

function installLookups() {
  server.use(
    http.get('/api/v1/categories', () => HttpResponse.json([{ id: 3, name: 'Rods', slug: 'rods', description: '', translations: null, parentCategoryId: null, productCount: 1 }])),
    http.get('/api/v1/brands', () => HttpResponse.json([{ id: 7, name: 'Acme', slug: 'acme', logoUrl: '' }])),
    http.get('/api/v1/promotions', () => HttpResponse.json([]))
  );
}

describe('useProductDetail', () => {
  it('loads the product and resolves its category and brand', async () => {
    installLookups();
    server.use(http.get('/api/v1/products/1', () => HttpResponse.json(product)));

    const { result } = renderHook(() => useProductDetail(), {
      wrapper: createProvidersWrapper({ route: '/product/1', routePattern: '/product/:id' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.product).toMatchObject({ id: 1, name: 'Rod' });
    expect(result.current.category).toMatchObject({ id: 3, name: 'Rods' });
    expect(result.current.brand).toMatchObject({ id: 7, name: 'Acme' });
    expect(result.current.error).toBeNull();
  });

  it('returns a not-found state for an invalid route id without requesting data', async () => {
    const requests: string[] = [];
    server.use(http.all('*', ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({});
    }));

    const { result } = renderHook(() => useProductDetail(), {
      wrapper: createProvidersWrapper({
        route: '/product/not-a-number',
        routePattern: '/product/:id',
      }),
    });

    expect(result.current.product).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('not_found');
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    expect(requests).toEqual([]);
  });

  it('exposes load errors and can reload', async () => {
    installLookups();
    let productCalls = 0;
    server.use(http.get('/api/v1/products/1', () => {
      productCalls += 1;
      return productCalls === 1
        ? HttpResponse.json({ message: 'Gone' }, { status: 404 })
        : HttpResponse.json(product);
    }));

    const { result } = renderHook(() => useProductDetail(), {
      wrapper: createProvidersWrapper({ route: '/product/1', routePattern: '/product/:id' }),
    });
    await waitFor(() => expect(result.current.error).toBe('Gone'));

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.product?.id).toBe(1));
    expect(result.current.error).toBeNull();
  });
});
