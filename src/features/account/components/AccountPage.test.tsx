import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { StoreProviders } from '../../../test/storeProviders';
import AccountPage from './AccountPage';

const user = {
  id: 22,
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Silva',
  role: 'ROLE_USER',
  enabled: true,
  phone: '912345678',
  huntingLicenseNumber: 'H-123',
  fishingLicenseNumber: null,
  addresses: [{ id: 23, recipientName: 'Ana Silva', recipientPhone: '912345678', street: 'Rua 1', city: 'Lisboa', postalCode: '1000-001', countryCode: 'PT', addressType: 'SHIPPING' }],
};

function renderAccount() {
  localStorage.setItem('access_token', 'access');
  server.use(
    http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
    http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 }))
  );
  return render(
    <StoreProviders route="/account">
      <Routes><Route path="/account" element={<AccountPage />} /></Routes>
    </StoreProviders>
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows the signed-in profile and link to order history', async () => {
    renderAccount();
    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Ana');
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
    expect(screen.getByRole('link', { name: 'View order history' })).toHaveAttribute('href', '/account/orders');
  });

  it('switches between profile, address and password panels', async () => {
    const actor = userEvent.setup();
    renderAccount();
    await screen.findByRole('heading', { name: 'Account' });

    await actor.click(screen.getByRole('button', { name: 'Addresses' }));
    expect(screen.getByText(/Rua 1/)).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Password' }));
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Profile' }));
    expect(screen.getByLabelText('First name')).toHaveValue('Ana');
  });
});

describe('AccountPage address book', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('adds a new address through the form', async () => {
    let posted: unknown;
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.post('/api/v1/users/22/addresses', async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({
          ...user,
          addresses: [...user.addresses, { id: 24, recipientName: 'Ana Silva', recipientPhone: '912000000', street: 'Rua 2', city: 'Porto', postalCode: '4000-001', countryCode: 'PT', addressType: 'SHIPPING' }],
        });
      })
    );
    const actor = userEvent.setup();
    render(
      <StoreProviders route="/account">
        <Routes><Route path="/account" element={<AccountPage />} /></Routes>
      </StoreProviders>
    );
    await screen.findByRole('heading', { name: 'Account' });
    await actor.click(screen.getByRole('button', { name: 'Addresses' }));

    await actor.click(screen.getByRole('button', { name: 'Add address' }));
    await actor.type(screen.getByLabelText('Recipient name'), 'Ana Silva');
    await actor.type(screen.getByLabelText('Recipient phone'), '912000000');
    await actor.type(screen.getByLabelText('Street'), 'Rua 2');
    await actor.type(screen.getByLabelText('Postal code'), '4000-001');
    await actor.type(screen.getByLabelText('City'), 'Porto');
    await actor.click(screen.getByRole('button', { name: 'Add address' }));

    expect(await screen.findByText('Address added.')).toBeInTheDocument();
    expect(posted).toMatchObject({ recipientName: 'Ana Silva', street: 'Rua 2', city: 'Porto', countryCode: 'PT' });
    expect(screen.getByText(/Rua 2/)).toBeInTheDocument();
  });

  it('rejects an incomplete address before saving', async () => {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 }))
    );
    const actor = userEvent.setup();
    render(
      <StoreProviders route="/account">
        <Routes><Route path="/account" element={<AccountPage />} /></Routes>
      </StoreProviders>
    );
    await screen.findByRole('heading', { name: 'Account' });
    await actor.click(screen.getByRole('button', { name: 'Addresses' }));
    await actor.click(screen.getByRole('button', { name: 'Add address' }));
    await actor.click(screen.getByRole('button', { name: 'Add address' }));

    expect((await screen.findAllByText('This field is required.')).length).toBeGreaterThan(0);
  });

  it('edits an existing address', async () => {
    let putBody: unknown;
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.put('/api/v1/users/22/addresses/23', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ ...user, addresses: [{ ...user.addresses[0], city: 'Braga' }] });
      })
    );
    const actor = userEvent.setup();
    render(
      <StoreProviders route="/account">
        <Routes><Route path="/account" element={<AccountPage />} /></Routes>
      </StoreProviders>
    );
    await screen.findByRole('heading', { name: 'Account' });
    await actor.click(screen.getByRole('button', { name: 'Addresses' }));
    await actor.click(screen.getByRole('button', { name: 'Edit address' }));

    const city = screen.getByLabelText('City');
    await actor.clear(city);
    await actor.type(city, 'Braga');
    await actor.click(screen.getByRole('button', { name: 'Save address' }));

    expect(await screen.findByText('Address updated.')).toBeInTheDocument();
    expect(putBody).toMatchObject({ city: 'Braga' });
  });

  it('deletes an address after confirmation', async () => {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(user)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.delete('/api/v1/users/22/addresses/23', () => new HttpResponse(null, { status: 204 })),
      http.get('/api/v1/users/22', () => HttpResponse.json({ ...user, addresses: [] }))
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const actor = userEvent.setup();
    render(
      <StoreProviders route="/account">
        <Routes><Route path="/account" element={<AccountPage />} /></Routes>
      </StoreProviders>
    );
    await screen.findByRole('heading', { name: 'Account' });
    await actor.click(screen.getByRole('button', { name: 'Addresses' }));
    await actor.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Address deleted.')).toBeInTheDocument();
    expect(screen.getByText('No saved addresses yet.')).toBeInTheDocument();
  });
});
