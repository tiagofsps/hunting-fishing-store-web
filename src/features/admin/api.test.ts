import { describe, expect, it } from 'vitest';
import { recordRequests, type RecordedRequest } from '../../test/recorder';
import * as api from './api';

/** Full product shape, because createProduct and updateProduct map the response. */
const PRODUCT_RESPONSE = {
  id: 5,
  name: 'Rod',
  slug: 'rod',
  requiresLicense: false,
  categoryId: 3,
  brandId: 7,
  translations: {},
  items: [],
  images: [],
};

const productPayload = {
  name: 'Rod',
  slug: 'rod',
  requiresLicense: false,
  categoryId: 3,
  brandId: 7,
  items: [{ sku: 'ROD-1', price: 10, stockQuantity: 2, active: true }],
  images: [],
};

function expectRequest(
  req: RecordedRequest | undefined,
  expected: { method: string; path: string; query?: Record<string, string>; body?: unknown }
) {
  expect(req, 'a request was sent').toBeDefined();
  expect(req!.method).toBe(expected.method);
  expect(req!.path).toBe(expected.path);
  if (expected.query) {
    expect(Object.fromEntries(req!.query.entries())).toEqual(expected.query);
  }
  if (expected.body !== undefined) {
    expect(req!.body).toEqual(expected.body);
  }
}

describe('admin API: products and users', () => {
  it('creates a product with POST and returns it mapped', async () => {
    const requests = recordRequests({ body: PRODUCT_RESPONSE, status: 201 });

    const product = await api.createProduct(productPayload);

    expectRequest(requests[0], { method: 'POST', path: '/api/v1/products', body: productPayload });
    expect(product.id).toBe(5);
  });

  it('updates a product with PUT on its id', async () => {
    const requests = recordRequests({ body: PRODUCT_RESPONSE });

    await api.updateProduct(5, productPayload);

    expectRequest(requests[0], { method: 'PUT', path: '/api/v1/products/5', body: productPayload });
  });

  it('deletes a product with DELETE on its id', async () => {
    const requests = recordRequests({ status: 204 });

    await api.deleteProduct(5);

    expectRequest(requests[0], { method: 'DELETE', path: '/api/v1/products/5' });
  });

  it('pages through users with page and size', async () => {
    const requests = recordRequests({ body: { content: [] } });

    await api.listUsers(2, 50);

    expectRequest(requests[0], { method: 'GET', path: '/api/v1/users', query: { page: '2', size: '50' } });
  });

  it('updates an admin-editable user profile field set with PUT on the user', async () => {
    const requests = recordRequests({ body: {} });

    await api.updateUserProfile(22, { firstName: 'Ana' });

    expectRequest(requests[0], { method: 'PUT', path: '/api/v1/users/22', body: { firstName: 'Ana' } });
  });
});

describe('admin API: orders', () => {
  it('lists all orders with paging', async () => {
    const requests = recordRequests({ body: { content: [] } });

    await api.listAllOrders(0, 20);

    expectRequest(requests[0], { method: 'GET', path: '/api/v1/orders', query: { page: '0', size: '20' } });
  });

  it('filters the order list by status', async () => {
    const requests = recordRequests({ body: { content: [] } });

    await api.listOrdersByStatus(0, 20, 'PAID');

    expectRequest(requests[0], {
      method: 'GET',
      path: '/api/v1/orders',
      query: { page: '0', size: '20', status: 'PAID' },
    });
  });

  it('changes an order status with PATCH on the status sub-resource', async () => {
    // Regression: this used to send a GET to the order path, which returns the
    // order unchanged, so admin status changes silently did nothing.
    const requests = recordRequests({ body: { orderNumber: 'ORD-1', status: 'PAID' } });

    await api.updateOrderStatus('ORD-1', 'PAID');

    expectRequest(requests[0], {
      method: 'PATCH',
      path: '/api/v1/orders/ORD-1/status',
      query: { status: 'PAID' },
    });
  });

  it('encodes the order number in the status path', async () => {
    const requests = recordRequests({ body: {} });

    await api.updateOrderStatus('ORD 1/2', 'SHIPPED');

    expect(requests[0].path).toBe('/api/v1/orders/ORD%201%2F2/status');
  });

  it('documents the allowed status transitions, with terminal states that go nowhere', () => {
    expect(api.ALLOWED_TRANSITIONS.DELIVERED).toEqual([]);
    expect(api.ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
    expect(api.ALLOWED_TRANSITIONS.PENDING).toEqual(['PAID', 'CANCELLED']);
  });
});

describe('admin API: categories and brands', () => {
  it.each([
    ['createCategory', () => api.createCategory({ name: 'Rods', slug: 'rods' }), 'POST', '/api/v1/categories'],
    ['updateCategory', () => api.updateCategory(3, { name: 'Rods', slug: 'rods' }), 'PUT', '/api/v1/categories/3'],
    ['deleteCategory', () => api.deleteCategory(3), 'DELETE', '/api/v1/categories/3'],
    ['createBrand', () => api.createBrand({ name: 'Shimano', slug: 'shimano' }), 'POST', '/api/v1/brands'],
    ['updateBrand', () => api.updateBrand(7, { name: 'Shimano', slug: 'shimano' }), 'PUT', '/api/v1/brands/7'],
    ['deleteBrand', () => api.deleteBrand(7), 'DELETE', '/api/v1/brands/7'],
  ])('%s sends %s %s', async (_name, call, method, path) => {
    const requests = recordRequests({ status: method === 'DELETE' ? 204 : 200, body: {} });

    await call();

    expectRequest(requests[0], { method, path });
  });
});

describe('admin API: stock, coupons and promotions', () => {
  it('records a stock movement with POST', async () => {
    const requests = recordRequests({ body: { id: 1 } });
    const movement = { productItemId: 9, quantity: -2, type: 'ADJUSTMENT' as const, notes: 'Damaged' };

    await api.createStockMovement(movement);

    expectRequest(requests[0], { method: 'POST', path: '/api/v1/stock-movements', body: movement });
  });

  it('lists the movement history for one variant', async () => {
    const requests = recordRequests({ body: [] });

    await api.listStockMovements(9);

    expectRequest(requests[0], { method: 'GET', path: '/api/v1/stock-movements/item/9' });
  });

  it('lists and creates coupons', async () => {
    const requests = recordRequests({ body: [] });
    await api.listCoupons();
    expectRequest(requests[0], { method: 'GET', path: '/api/v1/coupons' });

    const coupon = {
      code: 'SPRING10',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      validFrom: '2026-03-01',
      validTo: '2026-06-01',
    };
    const created = recordRequests({ body: { id: 1 } });
    await api.createCoupon(coupon);
    expectRequest(created[0], { method: 'POST', path: '/api/v1/coupons', body: coupon });
  });

  it('lists, creates and deletes promotions', async () => {
    const promotion = {
      name: 'Summer',
      discountType: 'FIXED_AMOUNT' as const,
      discountValue: 5,
      stackable: false,
      validFrom: '2026-06-01',
      validTo: '2026-08-31',
      rules: [{ targetType: 'CATEGORY' as const, targetId: 3 }],
    };

    const listed = recordRequests({ body: [] });
    await api.listPromotions();
    expectRequest(listed[0], { method: 'GET', path: '/api/v1/promotions' });

    const created = recordRequests({ body: { id: 1 } });
    await api.createPromotion(promotion);
    expectRequest(created[0], { method: 'POST', path: '/api/v1/promotions', body: promotion });

    const deleted = recordRequests({ status: 204 });
    await api.deletePromotion(4);
    expectRequest(deleted[0], { method: 'DELETE', path: '/api/v1/promotions/4' });
  });
});

describe('admin API: newsletter', () => {
  it('sends only the filters that are set', async () => {
    const requests = recordRequests({ body: { content: [] } });

    await api.listSubscriptions(1, 20, { active: true, q: 'ana' });
    await api.listSubscriptions(0, 20);

    expectRequest(requests[0], {
      method: 'GET',
      path: '/api/v1/newsletter/subscriptions',
      query: { page: '1', size: '20', active: 'true', q: 'ana' },
    });
    expect(Object.fromEntries(requests[1].query.entries())).toEqual({ page: '0', size: '20' });
  });

  it('keeps an inactive filter, because false is a real choice', async () => {
    const requests = recordRequests({ body: { content: [] } });

    await api.listSubscriptions(0, 20, { active: false });

    expect(requests[0].query.get('active')).toBe('false');
  });

  it('reads the active subscriber stats', async () => {
    const requests = recordRequests({ body: { active: 12 } });

    await expect(api.getNewsletterStats()).resolves.toEqual({ active: 12 });
    expectRequest(requests[0], { method: 'GET', path: '/api/v1/newsletter/subscriptions/stats' });
  });

  it('toggles a subscription with PATCH and an active flag', async () => {
    const requests = recordRequests({ body: { id: 3, active: false } });

    await api.updateSubscriptionStatus(3, false);

    expectRequest(requests[0], {
      method: 'PATCH',
      path: '/api/v1/newsletter/subscriptions/3',
      body: { active: false },
    });
  });

  it('deletes a subscription', async () => {
    const requests = recordRequests({ status: 204 });

    await api.deleteSubscription(3);

    expectRequest(requests[0], { method: 'DELETE', path: '/api/v1/newsletter/subscriptions/3' });
  });

  it('exports subscribers as raw CSV text with GET', async () => {
    const requests = recordRequests({ body: 'email\na@example.com\n' });

    await expect(api.exportSubscriptionsCsv()).resolves.toBe('email\na@example.com\n');
    expectRequest(requests[0], { method: 'GET', path: '/api/v1/newsletter/subscriptions/export' });
  });

  it('unsubscribes by email with DELETE and a body', async () => {
    const requests = recordRequests({ status: 204 });

    await api.unsubscribe('ana@example.com');

    expectRequest(requests[0], {
      method: 'DELETE',
      path: '/api/v1/newsletter/subscribe',
      body: { email: 'ana@example.com' },
    });
  });
});
