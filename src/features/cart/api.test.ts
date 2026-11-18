import { describe, expect, it } from 'vitest';
import { recordRequests } from '../../test/recorder';
import * as api from './api';
import type { CartResponse } from './types';

describe('cart API', () => {
  it('reads the server cart with GET', async () => {
    const requests = recordRequests({ body: { items: [] } });
    await api.getCart(22);
    expect(requests[0]).toMatchObject({ method: 'GET', path: '/api/v1/carts/22' });
  });

  it('adds a variant with POST and the variant id and quantity in the body', async () => {
    const requests = recordRequests({ body: { items: [] } });
    await api.addToCart(22, 24, 2);
    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/v1/carts/22/items',
      body: { productItemId: 24, quantity: 2 },
    });
  });

  it('sets an absolute quantity with PUT, sending the quantity as a query parameter the backend requires', async () => {
    const requests = recordRequests({ body: { items: [] } });
    await api.updateQuantity(22, 24, 5);
    expect(requests[0].method).toBe('PUT');
    expect(requests[0].path).toBe('/api/v1/carts/22/items/24');
    expect(requests[0].query.get('quantity')).toBe('5');
  });

  it('removes one variant with DELETE', async () => {
    const requests = recordRequests({ body: { items: [] } });
    await api.removeFromCart(22, 24);
    expect(requests[0]).toMatchObject({ method: 'DELETE', path: '/api/v1/carts/22/items/24' });
  });

  it('clears the whole cart with DELETE on the cart', async () => {
    const requests = recordRequests({ status: 204 });
    await api.clearCart(22);
    expect(requests[0]).toMatchObject({ method: 'DELETE', path: '/api/v1/carts/22' });
  });
});

describe('cartResponseToItems', () => {
  const response = {
    items: [
      {
        id: 1,
        productItemId: 24,
        productId: 15,
        productName: 'Keyboard',
        imageUrl: null,
        sku: 'KB-1',
        unitPrice: 35.26,
        stockQuantity: 50,
        quantity: 2,
        requiresLicense: true,
        licenseType: 'HUNTING',
      },
    ],
  } as unknown as CartResponse;

  it('maps each server line to a renderable cart item with its variant', () => {
    const [item] = api.cartResponseToItems(response);
    expect(item.product).toMatchObject({ id: 15, name: 'Keyboard', requiresLicense: true, licenseType: 'HUNTING' });
    expect(item.selectedItem).toEqual({ id: 24, sku: 'KB-1', price: 35.26, stockQuantity: 50 });
    expect(item.quantity).toBe(2);
  });

  it('turns a null image into undefined and a missing stock figure into zero', () => {
    const sparse = { items: [{ ...response.items[0], imageUrl: null, stockQuantity: null }] } as unknown as CartResponse;
    const [item] = api.cartResponseToItems(sparse);
    expect(item.product.imageUrl).toBeUndefined();
    expect(item.selectedItem?.stockQuantity).toBe(0);
  });
});
