import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordRequests } from '../test/recorder';
import * as api from './ordersApi';

const order = { id: 1, orderNumber: 'ORD-1', status: 'PENDING', items: [] };
const payment = { id: 2, orderId: 1, amount: 25, paymentMethod: 'MBWAY', status: 'PENDING' };

describe('orders API', () => {
  it('places an order with POST under the user checkout route', async () => {
    const requests = recordRequests({ body: order });
    const payload = { shippingAddressId: 23, couponCode: 'SAVE', items: [{ productItemId: 24, quantity: 2 }] };

    await api.placeOrder(22, payload);

    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/orders/checkout/22',
      body: payload,
    });
  });

  it('initiates payment with the server-side order id and selected method', async () => {
    const requests = recordRequests({ body: payment, status: 201 });
    const payload = { orderId: 1, paymentMethod: 'MBWAY', mbwayPhone: '912345678' };

    await api.initiatePayment(payload);

    expect(requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/payments', body: payload });
  });

  it("lists a user's orders from the user sub-resource", async () => {
    const requests = recordRequests({ body: [order] });
    await expect(api.listUserOrders(22)).resolves.toEqual([order]);
    expect(requests[0]).toMatchObject({ method: 'GET', path: '/api/v1/orders/user/22' });
  });

  it('gets an order by encoded order number', async () => {
    const requests = recordRequests({ body: order });
    await api.getOrderByNumber('ORD 1/2');
    expect(requests[0].method).toBe('GET');
    expect(requests[0].path).toBe('/api/v1/orders/ORD%201%2F2');
  });
});

describe('payment details storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when no payment is stored', () => {
    expect(api.getPaymentForOrder('ORD-1')).toBeNull();
  });

  it('stores different payment instructions by order number', () => {
    api.storePaymentForOrder('ORD-1', payment as never);
    api.storePaymentForOrder('ORD-2', { ...payment, orderId: 2 } as never);

    expect(api.getPaymentForOrder('ORD-1')).toEqual(payment);
    expect(api.getPaymentForOrder('ORD-2')).toMatchObject({ orderId: 2 });
  });

  it('returns null rather than throwing for corrupt stored JSON', () => {
    localStorage.setItem('order_payments', '{broken');
    expect(api.getPaymentForOrder('ORD-1')).toBeNull();
  });

  it('tolerates storage failures because payment details are best-effort', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => api.storePaymentForOrder('ORD-1', payment as never)).not.toThrow();
    setItem.mockRestore();
  });
});
