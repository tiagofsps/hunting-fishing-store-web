import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from '../../i18n/LanguageContext';
import { server } from '../../test/server';
import AuthProvider from '../../providers/AuthProvider';
import CartProvider from '../../providers/CartProvider';
import { useAuth } from '../../providers/useAuth';
import CheckoutPage from './components/CheckoutPage';

const userResponse = {
  id: 22,
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Silva',
  role: 'ROLE_USER',
  enabled: true,
  phone: '912345678',
  huntingLicenseNumber: null,
  fishingLicenseNumber: null,
  addresses: [{
    id: 23,
    recipientName: 'Ana Silva',
    recipientPhone: '912345678',
    street: 'Rua 1',
    city: 'Lisboa',
    postalCode: '1000-001',
    countryCode: 'PT',
    addressType: 'SHIPPING',
  }],
};

function CartForCurrentUser({ children }: { children: ReactNode }) {
  const { user: current } = useAuth();
  return <CartProvider userId={current?.id ?? null}>{children}</CartProvider>;
}

function CheckoutTestProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <MemoryRouter initialEntries={['/checkout']}>
        <AuthProvider>
          <CartForCurrentUser>{children}</CartForCurrentUser>
        </AuthProvider>
      </MemoryRouter>
    </LanguageProvider>
  );
}

function renderCheckout() {
  return render(
    <CheckoutTestProviders>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cart" element={<p>Cart route</p>} />
        <Route path="/" element={<p>Home route</p>} />
        <Route path="/account/orders" element={<p>Orders route</p>} />
        <Route path="/account/orders/:orderNumber" element={<p>Order detail route</p>} />
      </Routes>
    </CheckoutTestProviders>
  );
}

function installCart(itemOverrides: Record<string, unknown> = {}) {
  const cartItem = {
    id: 1,
    productItemId: 24,
    productId: 15,
    productName: 'Rod',
    imageUrl: null,
    sku: 'ROD-1',
    unitPrice: 35,
    quantity: 2,
    stockQuantity: 10,
    requiresLicense: false,
    licenseType: null,
    subTotal: 70,
    ...itemOverrides,
  };
  server.use(
    http.get('/api/v1/auth/me', () => HttpResponse.json(userResponse)),
    http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 2, userId: 22, items: [cartItem], totalAmount: 70 })),
    http.delete('/api/v1/carts/22', () => new HttpResponse(null, { status: 204 }))
  );
}

const order = {
  id: 17,
  orderNumber: 'ORD-17',
  orderDate: '2026-11-18T10:00:00Z',
  status: 'PENDING',
  subtotalAmount: 70,
  discountAmount: 0,
  totalAmount: 74.95,
  shippingCost: 4.95,
  userId: 22,
  shippingAddress: userResponse.addresses[0],
  billingAddress: userResponse.addresses[0],
  items: [{ id: 1, productItemId: 24, productName: 'Rod', sku: 'ROD-1', quantity: 2, unitPrice: 35, subTotal: 70 }],
};
const payment = {
  id: 9,
  orderId: 17,
  amount: 74.95,
  paymentMethod: 'MBWAY',
  status: 'PENDING',
  transactionId: null,
  multibancoEntity: null,
  multibancoReference: null,
  mbwayPhone: '912345678',
  paymentUrl: null,
  referenceExpiresAt: null,
};

describe('checkout user flow', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
    localStorage.setItem('access_token', 'session-token');
  });

  it('completes address → payment → review → order and payment receipt', async () => {
    installCart();
    let orderBody: unknown;
    let paymentBody: unknown;
    server.use(
      http.post('/api/v1/orders/checkout/22', async ({ request }) => {
        orderBody = await request.json();
        return HttpResponse.json(order, { status: 201 });
      }),
      http.post('/api/v1/payments', async ({ request }) => {
        paymentBody = await request.json();
        return HttpResponse.json(payment, { status: 201 });
      })
    );
    const user = userEvent.setup();
    renderCheckout();

    await screen.findByRole('heading', { name: 'Checkout' });
    expect(screen.getByRole('radio', { name: /Ana Silva/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Rod')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByRole('heading', { name: 'Select Payment Method' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /MB WAY/ }));
    await user.type(screen.getByLabelText('MB WAY Registered Mobile Phone Number'), '912345678');
    await user.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByLabelText('Discount Coupon')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Confirm & Place Order/ }));
    expect(await screen.findByText('ORD-17')).toBeInTheDocument();
    expect(screen.getByText('Please check your MB WAY app on phone')).toBeInTheDocument();
    expect(orderBody).toEqual({
      shippingAddressId: 23,
      couponCode: undefined,
      items: [{ productItemId: 24, quantity: 2 }],
    });
    expect(paymentBody).toEqual({ orderId: 17, paymentMethod: 'MBWAY', mbwayPhone: '912345678' });
    await waitFor(() => expect(localStorage.getItem('order_payments')).toContain('ORD-17'));
    expect(localStorage.getItem('cart_items')).toBeNull();
  });

  it('requires an MB WAY phone number before placing the order', async () => {
    installCart();
    const requests: string[] = [];
    server.use(http.post('/api/v1/orders/checkout/22', ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json(order);
    }));
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Checkout' });

    await user.click(screen.getByRole('button', { name: /Continue/ }));
    await user.click(screen.getByRole('radio', { name: /MB WAY/ }));
    await user.click(screen.getByRole('button', { name: /Continue/ }));
    await user.click(screen.getByRole('button', { name: /Confirm & Place Order/ }));

    expect(await screen.findByText('Please enter a valid MB WAY phone number.')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('collects a missing hunting licence before showing payment', async () => {
    installCart({ requiresLicense: true, licenseType: 'HUNTING' });
    let licenseBody: unknown;
    server.use(http.put('/api/v1/users/22', async ({ request }) => {
      licenseBody = await request.json();
      return HttpResponse.json({ ...userResponse, huntingLicenseNumber: 'H-123' });
    }));
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('heading', { name: 'Checkout' });

    await user.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText('License required')).toBeInTheDocument();
    const license = screen.getByLabelText('Hunting License Number');
    await user.type(license, 'H-123');
    await user.click(screen.getByRole('button', { name: /Save & Continue/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Select Payment Method' })).toBeInTheDocument());
    expect(licenseBody).toEqual({ huntingLicenseNumber: 'H-123', fishingLicenseNumber: undefined });
  });
});
