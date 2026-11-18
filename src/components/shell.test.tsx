import type { ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { LanguageProvider } from '../i18n/LanguageContext';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';
import PromotionBanner from '../features/home-page/components/PromotionBanner';
import { useLanguage } from '../i18n/useLanguage';

const userResponse = {
  id: 22,
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Silva',
  role: 'USER',
  enabled: true,
  addresses: [],
};

function installCatalog(promotions: unknown[] = []) {
  server.use(
    http.get('/api/v1/products', () => HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true })),
    http.get('/api/v1/categories', () => HttpResponse.json([{ id: 3, name: 'Rods', slug: 'rods', description: '', translations: null, parentCategoryId: null, productCount: 4 }])),
    http.get('/api/v1/brands', () => HttpResponse.json([{ id: 7, name: 'Acme', slug: 'acme', logoUrl: '' }])),
    http.get('/api/v1/promotions', () => HttpResponse.json(promotions))
  );
}

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </LanguageProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('app_lang', 'en');
});

describe('app shell', () => {
  it('renders the brand, navigation, search, language switch and footer', async () => {
    installCatalog();
    renderApp('/');

    expect((await screen.findAllByRole('link', { name: 'Wild Life' })).length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('navigates to the shop from the navbar search', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderApp('/');

    await actor.type(await screen.findByPlaceholderText('Search products...'), 'rod');
    await actor.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: 'Shop' })).toBeInTheDocument();
  });

  it('switches the interface language', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderApp('/');
    await screen.findByRole('button', { name: 'Sign In' });

    await actor.click(screen.getByRole('button', { name: 'PT' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument());
    expect(localStorage.getItem('app_lang')).toBe('pt');
  });

  it('shows the 404 page for an unknown route', async () => {
    installCatalog();
    renderApp('/does-not-exist');

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Homepage' })).toHaveAttribute('href', '/');
  });

  it('opens the sign-in dialog and the cart drawer from the navbar', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderApp('/');
    await screen.findByRole('button', { name: 'Sign In' });

    await actor.click(screen.getByRole('button', { name: 'Sign In' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sign In' });
    await actor.click(within(dialog).getByRole('button', { name: 'Close' }));

    await actor.click(screen.getByRole('button', { name: /Cart/ }));
    expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
  });
});

describe('user menu', () => {
  beforeEach(() => {
    localStorage.setItem('access_token', 'access');
    installCatalog();
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json(userResponse)),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 }))
    );
  });

  it('shows the signed-in user and navigates to the account', async () => {
    const actor = userEvent.setup();
    renderApp('/');
    const trigger = await screen.findByRole('button', { name: 'Account menu' });

    await actor.click(trigger);
    expect(screen.getByRole('menu', { name: 'Account menu' })).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Admin' })).not.toBeInTheDocument();

    await actor.click(screen.getByRole('menuitem', { name: 'My Account' }));
    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument();
  });

  it('closes on Escape and on an outside click', async () => {
    const actor = userEvent.setup();
    renderApp('/');
    const trigger = await screen.findByRole('button', { name: 'Account menu' });

    await actor.click(trigger);
    await actor.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await actor.click(trigger);
    await actor.click(document.body);
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });

  it('logs out and returns to the guest state', async () => {
    server.use(http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })));
    const actor = userEvent.setup();
    renderApp('/');
    const trigger = await screen.findByRole('button', { name: 'Account menu' });

    await actor.click(trigger);
    await actor.click(screen.getByRole('menuitem', { name: 'Logout' }));

    expect(await screen.findByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('shows the admin entry to administrators', async () => {
    server.use(http.get('/api/v1/auth/me', () => HttpResponse.json({ ...userResponse, role: 'ADMIN' })));
    const actor = userEvent.setup();
    renderApp('/');
    await actor.click(await screen.findByRole('button', { name: 'Account menu' }));

    expect(screen.getByRole('menuitem', { name: 'Admin' })).toBeInTheDocument();
  });
});

describe('PromotionBanner', () => {
  it('shows the first active promotion and can be dismissed', async () => {
    const actor = userEvent.setup();
    server.use(http.get('/api/v1/promotions', () => HttpResponse.json([{ id: 1, name: 'Summer', discountType: 'PERCENTAGE', discountValue: 20, priority: 1, stackable: false, validFrom: '2026-01-01', validTo: '2026-12-31', active: true, rules: [] }])));

    render(
      <LanguageProvider>
        <PromotionBanner />
      </LanguageProvider>
    );

    expect(await screen.findByText(/Summer/)).toBeInTheDocument();
    expect(screen.getByText(/20% OFF/)).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/Summer/)).not.toBeInTheDocument();
  });

  it('falls back to the default message when no promotion loads', async () => {
    server.use(http.get('/api/v1/promotions', () => HttpResponse.error()));
    render(
      <LanguageProvider>
        <PromotionBanner />
      </LanguageProvider>
    );
    expect(screen.getByText(/Free shipping/)).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  function Boom(): ReactNode {
    throw new Error('boom');
  }

  it('renders a localized fallback when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </LanguageProvider>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('renders its children when nothing throws', () => {
    render(
      <LanguageProvider>
        <ErrorBoundary>
          <p>Safe content</p>
        </ErrorBoundary>
      </LanguageProvider>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });
});

describe('language context', () => {
  it('falls back to the key for a missing translation', () => {
    function Probe() {
      const { t, language } = useLanguage();
      return <p>{`${language}:${t('does.not.exist')}`}</p>;
    }
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    expect(screen.getByText('en:does.not.exist')).toBeInTheDocument();
  });
});

describe('navbar mobile menu', () => {
  it('opens the mobile drawer, expands a catalog section and closes after navigating', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderApp('/');
    await screen.findByRole('button', { name: 'Open menu' });

    await actor.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' })).toBeInTheDocument();

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    const categoriesToggle = within(mobileNav.parentElement as HTMLElement).getByRole('button', { name: 'Categories' });
    await actor.click(categoriesToggle);
    expect(categoriesToggle).toHaveAttribute('aria-expanded', 'true');
    await actor.click(screen.getByRole('link', { name: /Rods/ }));

    await waitFor(() => expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument());
  });

  it('closes the mobile drawer with its toggle', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderApp('/');
    await screen.findByRole('button', { name: 'Open menu' });

    await actor.click(screen.getByRole('button', { name: 'Open menu' }));
    await actor.click(screen.getByRole('button', { name: 'Close menu' }));

    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });
});

describe('app routing', () => {
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
    items: [],
  };

  function installSession(role = 'USER') {
    localStorage.setItem('access_token', 'access');
    server.use(
      http.get('/api/v1/auth/me', () => HttpResponse.json({ ...userResponse, role })),
      http.get('/api/v1/carts/22', () => HttpResponse.json({ id: 1, userId: 22, items: [], totalAmount: 0 })),
      http.get('/api/v1/orders/user/22', () => HttpResponse.json([order])),
      http.get('/api/v1/orders/ORD-17', () => HttpResponse.json(order)),
      http.get('/api/v1/orders', () => HttpResponse.json({ content: [order], totalElements: 1, totalPages: 1, number: 0, size: 20, first: true, last: true, empty: false })),
      http.get('/api/v1/users', () => HttpResponse.json({ content: [userResponse], totalElements: 1, totalPages: 1, number: 0, size: 20, first: true, last: true, empty: false })),
      http.get('/api/v1/coupons', () => HttpResponse.json([])),
      http.get('/api/v1/newsletter/subscriptions', () => HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true, empty: true })),
      http.get('/api/v1/newsletter/subscriptions/stats', () => HttpResponse.json({ active: 0 })),
      http.get('/api/v1/stock-movements/item/24', () => HttpResponse.json([]))
    );
  }

  it('renders the cart route', async () => {
    installCatalog();
    renderApp('/cart');
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });

  it('redirects a guest from a guarded route and opens sign in', async () => {
    installCatalog();
    renderApp('/account/orders');
    expect(await screen.findByRole('dialog', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders the order history for a signed-in shopper', async () => {
    installCatalog();
    installSession();
    renderApp('/account/orders');
    expect(await screen.findByRole('heading', { name: 'My Orders' })).toBeInTheDocument();
    expect(await screen.findByText('ORD-17')).toBeInTheDocument();
  });

  it('renders a single order from the order route', async () => {
    installCatalog();
    installSession();
    renderApp('/order/ORD-17');
    expect(await screen.findByRole('heading', { name: 'ORD-17' })).toBeInTheDocument();
  });

  it('renders the admin console for an administrator', async () => {
    installCatalog();
    installSession('ADMIN');
    renderApp('/admin');
    expect(await screen.findByRole('heading', { name: 'Admin Console' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders admin sub-pages through the console layout', async () => {
    installCatalog();
    installSession('ADMIN');
    renderApp('/admin/orders');
    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(await screen.findByText('ORD-17')).toBeInTheDocument();
  });

  it('sends a signed-in shopper with an empty cart back from checkout', async () => {
    installCatalog();
    installSession();
    renderApp('/checkout');
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
  });
});
