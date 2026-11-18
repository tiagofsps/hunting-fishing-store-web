import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { setToken } from '../../lib/apiClient';
import { useAuth } from '../../providers/useAuth';
import { useOrderDetail, useOrders } from './hooks';

const user = {
  id: 22,
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Silva',
  role: 'ROLE_USER',
  enabled: true,
  addresses: [],
};
const order = {
  id: 17,
  orderNumber: 'ORD-17',
  orderDate: '2026-11-18T10:00:00Z',
  status: 'PAID',
  subtotalAmount: 20,
  discountAmount: 0,
  totalAmount: 24.95,
  shippingCost: 4.95,
  userId: 22,
  shippingAddress: {},
  billingAddress: {},
  items: [],
};

function installAuth() {
  setToken('session-token');
  server.use(http.get('/api/v1/auth/me', () => HttpResponse.json(user)));
}

describe('useOrders', () => {
  beforeEach(() => localStorage.clear());

  it('waits for session restoration, then loads orders for the authenticated user', async () => {
    installAuth();
    let calls = 0;
    server.use(http.get('/api/v1/orders/user/22', () => {
      calls += 1;
      return HttpResponse.json([order]);
    }));

    const { result } = renderHook(() => ({ orders: useOrders(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));
    await waitFor(() => expect(result.current.orders.loading).toBe(false));

    expect(result.current.orders.orders).toMatchObject([{ orderNumber: 'ORD-17', status: 'PAID' }]);
    expect(result.current.orders.error).toBeNull();
    expect(calls).toBe(1);
  });

  it('surfaces order load errors and can retry', async () => {
    installAuth();
    let calls = 0;
    server.use(http.get('/api/v1/orders/user/22', () => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json({ message: 'Orders unavailable' }, { status: 503 })
        : HttpResponse.json([order]);
    }));

    const { result } = renderHook(() => ({ orders: useOrders(), auth: useAuth() }), {
      wrapper: createProvidersWrapper({ auth: true }),
    });
    await waitFor(() => expect(result.current.auth.status).toBe('authenticated'));
    await waitFor(() => expect(result.current.orders.error).toBe('Orders unavailable'));
    act(() => result.current.orders.reload());
    await waitFor(() => expect(result.current.orders.orders).toHaveLength(1));
    expect(result.current.orders.error).toBeNull();
  });

  it('settles as a guest and does not issue an orders request without a token', async () => {
    const paths: string[] = [];
    server.use(http.all('*', ({ request }) => {
      paths.push(new URL(request.url).pathname);
      return HttpResponse.json({});
    }));

    const { result } = renderHook(() => useOrders(), { wrapper: createProvidersWrapper({ auth: true }) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders).toEqual([]);
    expect(paths).toEqual([]);
  });
});

describe('useOrderDetail', () => {
  beforeEach(() => localStorage.clear());

  it('settles as not found when the route has no order number', async () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper: createProvidersWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.order).toBeNull();
    expect(result.current.payment).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads an order by route number and the payment instructions saved at checkout', async () => {
    const payment = { id: 9, orderId: 17, amount: 24.95, paymentMethod: 'MBWAY', status: 'PENDING', transactionId: null, multibancoEntity: null, multibancoReference: null, mbwayPhone: '912345678', paymentUrl: null, referenceExpiresAt: null };
    localStorage.setItem('order_payments', JSON.stringify({ 'ORD-17': payment }));
    server.use(http.get('/api/v1/orders/ORD-17', () => HttpResponse.json(order)));

    const { result } = renderHook(() => useOrderDetail(), {
      wrapper: createProvidersWrapper({ route: '/account/orders/ORD-17', routePattern: '/account/orders/:orderNumber' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.order).toMatchObject({ orderNumber: 'ORD-17' });
    expect(result.current.payment).toEqual(payment);
    expect(result.current.error).toBeNull();
  });

  it('returns null payment instructions if none were stored', async () => {
    server.use(http.get('/api/v1/orders/ORD-17', () => HttpResponse.json(order)));
    const { result } = renderHook(() => useOrderDetail(), {
      wrapper: createProvidersWrapper({ route: '/account/orders/ORD-17', routePattern: '/account/orders/:orderNumber' }),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.payment).toBeNull();
  });

  it('surfaces a missing order', async () => {
    server.use(http.get('/api/v1/orders/ORD-404', () => HttpResponse.json({ message: 'Not found' }, { status: 404 })));
    const { result } = renderHook(() => useOrderDetail(), {
      wrapper: createProvidersWrapper({ route: '/account/orders/ORD-404', routePattern: '/account/orders/:orderNumber' }),
    });
    await waitFor(() => expect(result.current.error).toBe('Not found'));
    expect(result.current.order).toBeNull();
  });
});
