import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { StoreProviders } from '../../../test/storeProviders';
import OrdersPage from './OrdersPage';
import OrderDetailPage from './OrderDetailPage';

const user = { id: 22, email: 'ana@example.com', firstName: 'Ana', lastName: 'Silva', role: 'ROLE_USER', enabled: true, addresses: [] };
const order = {
  id: 17,
  orderNumber: 'ORD-17',
  orderDate: '2026-11-18T10:00:00Z',
  status: 'PAID',
  subtotalAmount: 100,
  discountAmount: 0,
  totalAmount: 104.95,
  shippingCost: 4.95,
  userId: 22,
  shippingAddress: { id: 23, recipientName: 'Ana Silva', recipientPhone: '912345678', street: 'Rua 1', city: 'Lisboa', postalCode: '1000-001', countryCode: 'PT', addressType: 'SHIPPING' },
  billingAddress: { id: 23, recipientName: 'Ana Silva', recipientPhone: '912345678', street: 'Rua 1', city: 'Lisboa', postalCode: '1000-001', countryCode: 'PT', addressType: 'SHIPPING' },
  items: [{ id: 1, productItemId: 24, productName: 'Rod', sku: 'ROD-1', quantity: 2, unitPrice: 50, subTotal: 100 }],
};

function renderOrders(path: string) {
  localStorage.setItem('access_token', 'access');
  server.use(
    http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
    http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
    http.get('/api/v1/orders/user/22', () => HttpResponse.json([order])),
    http.get('/api/v1/orders/ORD-17', () => HttpResponse.json(order))
  );
  return render(
    <StoreProviders route={path}>
      <Routes>
        <Route path="/account/orders" element={<OrdersPage />} />
        <Route path="/account/orders/:orderNumber" element={<OrderDetailPage />} />
      </Routes>
    </StoreProviders>
  );
}

describe('OrdersPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('lists orders with status, total and a detail link', async () => {
    renderOrders('/account/orders');
    expect(await screen.findByRole('heading', { name: 'My Orders' })).toBeInTheDocument();
    expect(await screen.findByText('ORD-17')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ORD-17/ })).toHaveAttribute('href', '/account/orders/ORD-17');
  });
});

describe('OrderDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows order details and the address after loading the route parameter', async () => {
    renderOrders('/account/orders/ORD-17');
    expect(await screen.findByRole('heading', { name: 'ORD-17' })).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0);
    expect(screen.getByText(/ROD-1/)).toBeInTheDocument();
  });
});
