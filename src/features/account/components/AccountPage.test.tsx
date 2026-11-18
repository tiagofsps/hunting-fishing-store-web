import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
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
