import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { StoreProviders } from '../test/storeProviders';
import { useOverlays } from './overlay-context';

function Trigger() {
  const { openAuth, openCartDrawer, openQuickView } = useOverlays();
  return (
    <div>
      <button onClick={openAuth}>open auth</button>
      <button onClick={openCartDrawer}>open cart</button>
      <button
        onClick={() =>
          openQuickView({
            id: 1,
            name: 'Rod',
            slug: 'rod',
            categoryId: 1,
            brandId: 1,
            price: 10,
            stockQuantity: 2,
          })
        }
      >
        open quick view
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('app_lang', 'en');
});

describe('OverlayProvider', () => {
  it('opens and closes the auth dialog', async () => {
    const actor = userEvent.setup();
    render(
      <StoreProviders>
        <Routes><Route path="/" element={<Trigger />} /></Routes>
      </StoreProviders>
    );

    await actor.click(screen.getByRole('button', { name: 'open auth' }));
    expect(await screen.findByRole('dialog', { name: 'Sign In' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the cart drawer and offers checkout', async () => {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json({ id: 22, email: 'a@b.pt', firstName: 'Ana', lastName: 'S', role: 'USER', enabled: true, addresses: [] })),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 }))
    );
    const actor = userEvent.setup();
    render(
      <StoreProviders>
        <Routes>
          <Route path="/" element={<Trigger />} />
          <Route path="/checkout" element={<p>Checkout page</p>} />
        </Routes>
      </StoreProviders>
    );

    await actor.click(screen.getByRole('button', { name: 'open cart' }));
    expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Close cart' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Your Cart' })).not.toBeInTheDocument());
  });

  it('opens and closes the quick view modal', async () => {
    const actor = userEvent.setup();
    render(
      <StoreProviders>
        <Routes><Route path="/" element={<Trigger />} /></Routes>
      </StoreProviders>
    );

    await actor.click(screen.getByRole('button', { name: 'open quick view' }));
    expect(await screen.findByRole('heading', { name: 'Rod' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Rod' })).not.toBeInTheDocument());
  });
});
