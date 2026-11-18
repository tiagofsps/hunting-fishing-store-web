import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('OrderDetailPage payment and errors', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows stored Multibanco payment instructions for the order', async () => {
    localStorage.setItem('order_payments', JSON.stringify({
      'ORD-17': {
        id: 9,
        orderId: 17,
        amount: 104.95,
        paymentMethod: 'MULTIBANCO',
        status: 'PENDING',
        transactionId: null,
        multibancoEntity: '12345',
        multibancoReference: '123 456 789',
        mbwayPhone: null,
        paymentUrl: null,
        referenceExpiresAt: null,
      },
    }));
    renderOrders('/account/orders/ORD-17');

    expect(await screen.findByText('12345')).toBeInTheDocument();
    expect(screen.getByText('123 456 789')).toBeInTheDocument();
    expect(screen.getByText('MULTIBANCO')).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown order', async () => {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.get('/api/v1/orders/MISSING', () => HttpResponse.json({ message: 'Not found' }, { status: 404 }))
    );
    render(
      <StoreProviders route="/account/orders/MISSING">
        <Routes>
          <Route path="/account/orders/:orderNumber" element={<OrderDetailPage />} />
        </Routes>
      </StoreProviders>
    );
    expect(await screen.findByRole('heading', { name: 'Order not found' })).toBeInTheDocument();
  });
});

describe('OrdersPage empty and error states', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows an empty state when there are no orders', async () => {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.get('/api/v1/orders/user/22', () => HttpResponse.json([]))
    );
    render(
      <StoreProviders route="/account/orders">
        <Routes><Route path="/account/orders" element={<OrdersPage />} /></Routes>
      </StoreProviders>
    );
    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/shop');
  });

  it('shows an error and retries', async () => {
    let calls = 0;
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.get('/api/v1/orders/user/22', () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({ message: 'Boom' }, { status: 500 }) : HttpResponse.json([order]);
      })
    );
    const actor = userEvent.setup();
    render(
      <StoreProviders route="/account/orders">
        <Routes><Route path="/account/orders" element={<OrdersPage />} /></Routes>
      </StoreProviders>
    );
    expect(await screen.findByText(/Boom/)).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('ORD-17')).toBeInTheDocument();
  });
});
