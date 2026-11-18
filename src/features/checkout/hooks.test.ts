import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { createProvidersWrapper } from '../../test/renderWithProviders';
import { useCheckout } from './hooks';

const order = {
  id: 17,
  orderNumber: 'ORD-17',
  orderDate: '2026-11-18T10:00:00Z',
  status: 'PENDING',
  subtotalAmount: 20,
  discountAmount: 0,
  totalAmount: 24.95,
  shippingCost: 4.95,
  userId: 22,
  shippingAddress: {},
  billingAddress: {},
  items: [],
};
const payment = {
  id: 9,
  orderId: 17,
  amount: 24.95,
  paymentMethod: 'MBWAY',
  status: 'PENDING',
  transactionId: null,
  multibancoEntity: null,
  multibancoReference: null,
  mbwayPhone: '912345678',
  paymentUrl: null,
  referenceExpiresAt: null,
};

const params = {
  userId: 22,
  shippingAddressId: 23,
  paymentMethod: 'mbway' as const,
  mbwayPhone: '912345678',
  items: [{ productItemId: 24, quantity: 2 }],
};

describe('useCheckout', () => {
  it('places the order, initiates payment with the API method and stores the payment by order number', async () => {
    const seen: Array<{ path: string; method: string; body: unknown }> = [];
    server.use(
      http.all('*', async ({ request }) => {
        const url = new URL(request.url);
        const bodyText = await request.text();
        seen.push({ path: url.pathname, method: request.method, body: bodyText ? JSON.parse(bodyText) : undefined });
        if (url.pathname === '/api/v1/orders/checkout/22') return HttpResponse.json(order, { status: 201 });
        if (url.pathname === '/api/v1/payments') return HttpResponse.json(payment, { status: 201 });
        return HttpResponse.json({}, { status: 404 });
      })
    );

    const { result } = renderHook(() => useCheckout(), { wrapper: createProvidersWrapper() });
    let response;
    await act(async () => {
      response = await result.current.placeOrder(params);
    });

    expect(response).toEqual({ order, payment });
    expect(result.current.isPlacingOrder).toBe(false);
    expect(result.current.error).toBe('');
    expect(seen).toEqual([
      {
        path: '/api/v1/orders/checkout/22',
        method: 'POST',
        body: { shippingAddressId: 23, billingAddressId: undefined, couponCode: undefined, items: params.items },
      },
      {
        path: '/api/v1/payments',
        method: 'POST',
        body: { orderId: 17, paymentMethod: 'MBWAY', mbwayPhone: '912345678' },
      },
    ]);
    expect(localStorage.getItem('order_payments')).toContain('ORD-17');
  });

  it('omits optional checkout fields when not supplied', async () => {
    const seen: unknown[] = [];
    server.use(
      http.post('/api/v1/orders/checkout/22', async ({ request }) => {
        seen.push(await request.json());
        return HttpResponse.json(order);
      }),
      http.post('/api/v1/payments', async ({ request }) => {
        seen.push(await request.json());
        return HttpResponse.json({ ...payment, paymentMethod: 'MULTIBANCO', mbwayPhone: null });
      })
    );
    const { result } = renderHook(() => useCheckout(), { wrapper: createProvidersWrapper() });

    await act(async () => {
      await result.current.placeOrder({ userId: 22, shippingAddressId: 23, paymentMethod: 'multibanco' });
    });

    expect(seen[0]).toEqual({ shippingAddressId: 23 });
    expect(seen[1]).toEqual({ orderId: 17, paymentMethod: 'MULTIBANCO' });
  });

  it('records an API failure, rethrows it, and clears the submitting state', async () => {
    server.use(
      http.post('/api/v1/orders/checkout/22', () => HttpResponse.json({ message: 'Out of stock' }, { status: 409 }))
    );
    const { result } = renderHook(() => useCheckout(), { wrapper: createProvidersWrapper() });
    let thrown: unknown;

    await act(async () => {
      try {
        await result.current.placeOrder(params);
      } catch (error) {
        thrown = error;
      }
    });

    expect(thrown).toMatchObject({ status: 409, message: 'Out of stock' });
    expect(result.current.error).toBe('Out of stock');
    expect(result.current.isPlacingOrder).toBe(false);
  });

  it('clears a previous error before a successful retry', async () => {
    let calls = 0;
    server.use(
      http.post('/api/v1/orders/checkout/22', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ message: 'Try again' }, { status: 500 })
          : HttpResponse.json(order);
      }),
      http.post('/api/v1/payments', () => HttpResponse.json(payment))
    );
    const { result } = renderHook(() => useCheckout(), { wrapper: createProvidersWrapper() });

    await act(async () => {
      await result.current.placeOrder(params).catch(() => undefined);
    });
    expect(result.current.error).toBe('Try again');

    await act(async () => {
      await result.current.placeOrder(params);
    });
    await waitFor(() => expect(result.current.error).toBe(''));
  });
});
