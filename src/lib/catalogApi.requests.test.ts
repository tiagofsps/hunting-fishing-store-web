import { describe, expect, it } from 'vitest';
import { recordRequests } from '../test/recorder';
import * as api from './catalogApi';

const productResponse = {
  id: 1,
  name: 'Rod',
  slug: 'rod',
  description: 'Light',
  translations: null,
  requiresLicense: false,
  licenseType: null,
  categoryId: 3,
  brandId: 7,
  items: [],
  images: [],
};

describe('catalog requests', () => {
  it('sets defaults and URL-encodes filters for product paging', async () => {
    const requests = recordRequests({
      body: {
        content: [productResponse],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
        empty: false,
      },
    });

    const result = await api.getProductsPage({ categoryId: 3, brandId: 7, q: 'rod & reel', sort: 'createdAt', direction: 'asc' });

    expect(requests[0].method).toBe('GET');
    expect(requests[0].path).toBe('/api/v1/products');
    expect(Object.fromEntries(requests[0].query.entries())).toEqual({
      page: '0',
      size: '20',
      categoryId: '3',
      brandId: '7',
      q: 'rod & reel',
      sort: 'createdAt',
      direction: 'asc',
    });
    expect(result.content[0]).toMatchObject({ id: 1, name: 'Rod' });
  });

  it('allows caller overrides for product page and size', async () => {
    const requests = recordRequests({ body: { content: [] } });
    await api.getProductsPage({ page: 4, size: 7 });
    expect(Object.fromEntries(requests[0].query.entries())).toEqual({ page: '4', size: '7' });
  });

  it('fetches a product by id', async () => {
    const requests = recordRequests({ body: productResponse });
    await api.getProductById(1);
    expect(requests[0]).toMatchObject({ method: 'GET', path: '/api/v1/products/1' });
  });

  it('fetches and maps categories and brands', async () => {
    const requests = recordRequests({ body: [{ id: 3, name: 'Rods', slug: 'rods', description: '', translations: null, parentCategoryId: null, productCount: 4 }] });
    await expect(api.getCategories()).resolves.toMatchObject([{ id: 3, name: 'Rods', productCount: 4 }]);
    expect(requests[0].path).toBe('/api/v1/categories');

    const brands = recordRequests({ body: [{ id: 7, name: 'Shimano', slug: 'shimano', logoUrl: '/brands/shimano.png' }] });
    await expect(api.getBrands()).resolves.toMatchObject([{ id: 7, name: 'Shimano' }]);
    expect(brands[0].path).toBe('/api/v1/brands');
  });

  it('fetches promotions and maps percentage and fixed-amount discounts', async () => {
    const requests = recordRequests({
      body: [
        { id: 1, name: 'Sale', discountType: 'PERCENTAGE', discountValue: 20, priority: 1, stackable: false, validFrom: '2026-01-01', validTo: '2026-12-31', active: true, rules: [] },
        { id: 2, name: 'Fixed', discountType: 'FIXED_AMOUNT', discountValue: 5, priority: 2, stackable: true, validFrom: '2026-01-01', validTo: '2026-12-31', active: false, rules: [{ id: 3, targetType: 'CATEGORY', targetId: 3 }] },
      ],
    });

    const promotions = await api.getPromotions();

    expect(requests[0].path).toBe('/api/v1/promotions');
    expect(promotions).toMatchObject([
      { id: 1, title: 'Sale', discountPercentage: 20, active: true, rules: [] },
      { id: 2, title: 'Fixed', discountPercentage: 0, active: false, rules: [{ targetType: 'CATEGORY', targetId: 3 }] },
    ]);
  });
});
