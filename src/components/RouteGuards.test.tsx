import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { StoreProviders } from '../test/storeProviders';
import RequireAdmin from './RequireAdmin';
import RequireAuth from './RequireAuth';

const user = { id: 22, email: 'ana@example.com', firstName: 'Ana', lastName: 'Silva', role: 'USER', enabled: true, addresses: [] };

function renderGuard(path: string, userRole: string | null) {
  if (userRole) {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json({ ...user, role: userRole })),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 }))
    );
  }
  return render(
    <StoreProviders route={path}>
      <Routes>
        <Route path="/private" element={<RequireAuth><p>Private content</p></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><p>Admin content</p></RequireAdmin>} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </StoreProviders>
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('renders a localized loading status while the saved session is being restored', async () => {
    localStorage.setItem('access_token', 'access');
    let resolveMe!: (response: Response) => void;
    server.use(
      http.get('/api/v1/auth/me', () => new Promise<Response>((resolve) => { resolveMe = resolve; })),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 }))
    );
    render(
      <StoreProviders route="/private">
        <Routes>
          <Route path="/private" element={<RequireAuth><p>Private content</p></RequireAuth>} />
          <Route path="/" element={<p>Home page</p>} />
        </Routes>
      </StoreProviders>
    );

    expect(screen.getByRole('status', { name: 'Loading catalog data...' })).toBeInTheDocument();
    await waitFor(() => expect(resolveMe).toBeTypeOf('function'));
    resolveMe(HttpResponse.json(user));
    await screen.findByText('Private content');
  });

  it('opens the sign-in modal and redirects a guest away from a private route', async () => {
    renderGuard('/private', null);
    expect(await screen.findByText('Home page')).toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  });
});

describe('RequireAdmin', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows an explicit permission message to a regular signed-in user', async () => {
    renderGuard('/admin', 'USER');
    expect(await screen.findByText('You do not have permission to access the admin console.')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('renders admin content for an administrator', async () => {
    renderGuard('/admin', 'ADMIN');
    expect(await screen.findByText('Admin content')).toBeInTheDocument();
  });
});
