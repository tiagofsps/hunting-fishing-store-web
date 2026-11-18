import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import type { CartItem, Product } from '../types';
import { server } from '../test/server';
import CartProvider from './CartProvider';
import { useCart } from './useCart';

const product: Product = {
  id: 15,
  name: 'Rod',
  slug: 'rod',
  categoryId: 3,
  brandId: 7,
  requiresLicense: false,
  items: [{ id: 24, sku: 'ROD-1', price: 10, stockQuantity: 10, active: true }],
};

const guestLine: CartItem = {
  product,
  selectedItem: product.items?.[0],
  quantity: 2,
};

function wrapper(userId: number | null) {
  return function CartWrapper({ children }: { children: ReactNode }) {
    return <CartProvider userId={userId}>{children}</CartProvider>;
  };
}

describe('useCart guest behavior', () => {
  it('loads, updates and persists guest cart lines in localStorage', async () => {
    localStorage.setItem('cart_items', JSON.stringify([guestLine]));
    const { result } = renderHook(() => useCart(), { wrapper: wrapper(null) });
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
    expect(result.current.totalCount).toBe(2);
    expect(result.current.subtotal).toBe(20);

    act(() => result.current.addToCart(product, product.items?.[0], 1));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(3);
    expect(JSON.parse(localStorage.getItem('cart_items')!)[0].quantity).toBe(3);

    act(() => result.current.updateQuantity(15, 'ROD-1', -1));
    expect(result.current.cartItems[0].quantity).toBe(2);
    act(() => result.current.removeItem(15, 'ROD-1'));
    expect(result.current.cartItems).toEqual([]);
    expect(JSON.parse(localStorage.getItem('cart_items')!)).toEqual([]);
  });

  it('removes a line when its quantity is decremented to zero', async () => {
    localStorage.setItem('cart_items', JSON.stringify([guestLine]));
    const { result } = renderHook(() => useCart(), { wrapper: wrapper(null) });
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));

    act(() => result.current.updateQuantity(15, 'ROD-1', -2));

    expect(result.current.cartItems).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('clears the local cart', async () => {
    localStorage.setItem('cart_items', JSON.stringify([guestLine]));
    const { result } = renderHook(() => useCart(), { wrapper: wrapper(null) });
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));

    act(() => result.current.clearCart());

    expect(result.current.cartItems).toEqual([]);
    expect(JSON.parse(localStorage.getItem('cart_items')!)).toEqual([]);
  });
});

describe('useCart server behavior', () => {
  it('loads server lines, syncs only new guest variants, and clears guest storage', async () => {
    const existingServerLine = {
      id: 1,
      productItemId: 24,
      productId: 15,
      productName: 'Rod',
      imageUrl: null,
      sku: 'ROD-1',
      unitPrice: 10,
      stockQuantity: 10,
      quantity: 7,
      requiresLicense: false,
      licenseType: null,
    };
    const newProduct: Product = {
      id: 16,
      name: 'Reel',
      slug: 'reel',
      categoryId: 3,
      brandId: 7,
      requiresLicense: false,
      items: [{ id: 25, sku: 'REEL-1', price: 20, stockQuantity: 3, active: true }],
    };
    const newGuestLine: CartItem = { product: newProduct, selectedItem: newProduct.items?.[0], quantity: 2 };
    localStorage.setItem('cart_items', JSON.stringify([guestLine, newGuestLine]));
    const updates: Array<{ path: string; body: string | null }> = [];
    server.use(
      http.get('/api/v1/carts/22', () => HttpResponse.json({ items: [existingServerLine] })),
      http.put('/api/v1/carts/22/items/:productItemId', async ({ request }) => {
        updates.push({ path: new URL(request.url).pathname, body: new URL(request.url).searchParams.get('quantity') });
        return HttpResponse.json({ items: [existingServerLine] });
      })
    );

    const { result } = renderHook(() => useCart(), { wrapper: wrapper(22) });
    await waitFor(() => expect(result.current.cartItems).toHaveLength(2));

    expect(updates).toEqual([{ path: '/api/v1/carts/22/items/25', body: '2' }]);
    expect(result.current.cartItems.find((item) => item.product.id === 15)?.quantity).toBe(7);
    expect(result.current.cartItems.find((item) => item.product.id === 16)?.quantity).toBe(2);
    expect(localStorage.getItem('cart_items')).toBeNull();
  });

  it('leaves the logged-in cart empty if the server is unavailable', async () => {
    localStorage.setItem('cart_items', JSON.stringify([guestLine]));
    server.use(http.get('/api/v1/carts/22', () => HttpResponse.json({}, { status: 503 })));

    const { result } = renderHook(() => useCart(), { wrapper: wrapper(22) });
    await waitFor(() => expect(result.current.cartItems).toEqual([]));
    expect(result.current.totalCount).toBe(0);
  });
});

describe('useCart server mutations', () => {
  it('pushes quantity changes and removals to the server and clears through the API', async () => {
    const existing = {
      id: 1,
      productItemId: 24,
      productId: 15,
      productName: 'Rod',
      imageUrl: null,
      sku: 'ROD-1',
      unitPrice: 10,
      stockQuantity: 10,
      quantity: 2,
      requiresLicense: false,
      licenseType: null,
    };
    const calls: string[] = [];
    server.use(
      http.get('/api/v1/carts/22', () => HttpResponse.json({ items: [existing] })),
      http.put('/api/v1/carts/22/items/24', ({ request }) => {
        calls.push(`PUT ${new URL(request.url).searchParams.get('quantity')}`);
        return HttpResponse.json({ items: [existing] });
      }),
      http.delete('/api/v1/carts/22/items/24', () => {
        calls.push('DELETE item');
        return HttpResponse.json({ items: [] });
      }),
      http.delete('/api/v1/carts/22', () => {
        calls.push('DELETE cart');
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useCart(), { wrapper: wrapper(22) });
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));

    act(() => result.current.updateQuantity(15, 'ROD-1', 1));
    act(() => result.current.addToCart(product, product.items?.[0], 1));
    act(() => result.current.removeItem(15, 'ROD-1'));
    act(() => result.current.clearCart());

    await waitFor(() => expect(calls).toContain('DELETE cart'));
    expect(calls).toContain('PUT 3');
    expect(calls).toContain('DELETE item');
    expect(result.current.cartItems).toEqual([]);
  });

  it('decrements to zero by removing the line on the server', async () => {
    const existing = {
      id: 1, productItemId: 24, productId: 15, productName: 'Rod', imageUrl: null,
      sku: 'ROD-1', unitPrice: 10, stockQuantity: 10, quantity: 1, requiresLicense: false, licenseType: null,
    };
    const calls: string[] = [];
    server.use(
      http.get('/api/v1/carts/22', () => HttpResponse.json({ items: [existing] })),
      http.delete('/api/v1/carts/22/items/24', () => {
        calls.push('DELETE item');
        return HttpResponse.json({ items: [] });
      })
    );
    const { result } = renderHook(() => useCart(), { wrapper: wrapper(22) });
    await waitFor(() => expect(result.current.cartItems).toHaveLength(1));

    act(() => result.current.updateQuantity(15, 'ROD-1', -1));

    await waitFor(() => expect(calls).toContain('DELETE item'));
    expect(result.current.cartItems).toEqual([]);
  });
});
