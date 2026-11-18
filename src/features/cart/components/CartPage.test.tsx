import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import type { CartItem } from '../../../types';
import { server } from '../../../test/server';
import { StoreProviders } from '../../../test/storeProviders';
import CartPage from './CartPage';

const product = {
  id: 15,
  name: 'Rod',
  slug: 'rod',
  description: '',
  translations: { pt: { name: 'Cana' } },
  categoryId: 3,
  brandId: 7,
  imageUrl: '/images/rod.jpg',
  requiresLicense: false,
  items: [{ id: 24, sku: 'ROD-1', price: 50, stockQuantity: 10, active: true }],
};
const cartLine: CartItem = { product, selectedItem: product.items[0], quantity: 2 };
const userResponse = { id: 22, email: 'ana@example.com', firstName: 'Ana', lastName: 'Silva', role: 'ROLE_USER', enabled: true, addresses: [] };
const serverCart = {
  id: 2,
  userId: 22,
  items: [{ id: 1, productItemId: 24, productId: 15, productName: 'Rod', imageUrl: '/images/rod.jpg', sku: 'ROD-1', unitPrice: 50, stockQuantity: 10, quantity: 2, requiresLicense: false, licenseType: null, subTotal: 100 }],
  totalAmount: 100,
};

function renderCart(route = '/cart') {
  return render(
    <StoreProviders route={route}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<p>Checkout route</p>} />
        <Route path="/shop" element={<p>Shop route</p>} />
      </Routes>
    </StoreProviders>
  );
}

describe('CartPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows an empty state with a link back to the shop', () => {
    renderCart();
    expect(screen.getByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/shop');
  });

  it('renders guest cart totals and updates quantities accessibly', async () => {
    localStorage.setItem('cart_items', JSON.stringify([cartLine]));
    const actor = userEvent.setup();
    renderCart();
    expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rod' })).toHaveAttribute('src', '/images/rod.jpg');
    expect(screen.getByRole('button', { name: 'Increase quantity: Rod' })).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'Increase quantity: Rod' }));
    expect(screen.getByText('3', { selector: 'span' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('cart_items')!)[0].quantity).toBe(3);

    await actor.click(screen.getByRole('button', { name: 'Remove product: Rod' }));
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('opens the authentication modal when a guest tries to check out', async () => {
    localStorage.setItem('cart_items', JSON.stringify([cartLine]));
    const actor = userEvent.setup();
    renderCart();
    await screen.findByRole('heading', { name: 'Your Cart' });

    await actor.click(screen.getByRole('button', { name: 'Sign in to continue' }));

    expect(await screen.findByRole('dialog', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('takes an authenticated shopper to checkout', async () => {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(userResponse)),
      http.get('/api/v1/carts/22', () => HttpResponse.json(serverCart))
    );
    const actor = userEvent.setup();
    renderCart();
    await screen.findByRole('heading', { name: 'Your Cart' });

    await actor.click(screen.getByRole('button', { name: 'Complete Order' }));

    await waitFor(() => expect(screen.getByText('Checkout route')).toBeInTheDocument());
  });
});
