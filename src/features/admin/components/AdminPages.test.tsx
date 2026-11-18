import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';
import AdminBrandsPage from './AdminBrandsPage';
import AdminCategoriesPage from './AdminCategoriesPage';
import AdminCouponsPage from './AdminCouponsPage';
import AdminDashboardPage from './AdminDashboardPage';
import AdminNewsletterPage from './AdminNewsletterPage';
import AdminOrdersPage from './AdminOrdersPage';
import AdminProductsPage from './AdminProductsPage';
import AdminPromotionsPage from './AdminPromotionsPage';
import AdminStockPage from './AdminStockPage';
import AdminUsersPage from './AdminUsersPage';

const product = {
  id: 15,
  name: 'Carbon Rod',
  slug: 'carbon-rod',
  description: 'A fishing rod',
  translations: { en: { name: 'Carbon Rod', description: 'A fishing rod' }, pt: { name: 'Cana Carbono' } },
  requiresLicense: false,
  licenseType: null,
  categoryId: 3,
  brandId: 7,
  items: [{ id: 24, sku: 'ROD-1', price: 129.9, stockQuantity: 8, weight: 0.5, active: true, attributes: {} }],
  images: [],
};
const category = { id: 3, name: 'Rods', slug: 'rods', description: 'Fishing rods', translations: { en: { name: 'Rods' }, pt: { name: 'Canas' } }, parentCategoryId: null, productCount: 4 };
const brand = { id: 7, name: 'Acme', slug: 'acme', logoUrl: '/brands/acme.svg' };
const order = {
  id: 17,
  orderNumber: 'ORD-17',
  orderDate: '2026-11-18T10:00:00Z',
  status: 'PENDING',
  subtotalAmount: 100,
  discountAmount: 0,
  totalAmount: 104.95,
  shippingCost: 4.95,
  userId: 22,
  shippingAddress: { id: 23, recipientName: 'Ana Silva', recipientPhone: '912345678', street: 'Rua 1', city: 'Lisboa', postalCode: '1000-001', countryCode: 'PT', addressType: 'SHIPPING' },
  billingAddress: { id: 23, recipientName: 'Ana Silva', recipientPhone: '912345678', street: 'Rua 1', city: 'Lisboa', postalCode: '1000-001', countryCode: 'PT', addressType: 'SHIPPING' },
  items: [],
};
const user = { id: 22, email: 'ana@example.com', firstName: 'Ana', lastName: 'Silva', role: 'ROLE_USER', enabled: true, addresses: [] };
const subscription = { id: 31, email: 'fan@example.com', active: true, subscribedAt: '2026-11-01T10:00:00Z' };
const page = <T,>(content: T[], totalElements = content.length) => ({ content, totalElements, totalPages: totalElements > 0 ? 1 : 0, number: 0, size: 20, first: true, last: true, empty: content.length === 0 });

function installAdminHandlers() {
  const seen: Array<{ method: string; path: string; query: URLSearchParams; body: unknown }> = [];
  server.use(http.all('*', async ({ request }) => {
    const url = new URL(request.url);
    const text = await request.text();
    let body: unknown;
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }
    seen.push({ method: request.method, path: url.pathname, query: url.searchParams, body });

    if (request.method === 'GET') {
      if (url.pathname === '/api/v1/products') return HttpResponse.json(page([product], 9));
      if (url.pathname === '/api/v1/categories') return HttpResponse.json([category]);
      if (url.pathname === '/api/v1/brands') return HttpResponse.json([brand]);
      if (url.pathname === '/api/v1/orders') return HttpResponse.json(page([order], 1));
      if (url.pathname === '/api/v1/users') return HttpResponse.json(page([user], 1));
      if (url.pathname === '/api/v1/coupons') return HttpResponse.json([]);
      if (url.pathname === '/api/v1/promotions') return HttpResponse.json([]);
      if (url.pathname === '/api/v1/stock-movements/item/24') return HttpResponse.json([]);
      if (url.pathname === '/api/v1/newsletter/subscriptions/stats') return HttpResponse.json({ active: 14 });
      if (url.pathname === '/api/v1/newsletter/subscriptions') return HttpResponse.json(page([subscription], 1));
      if (url.pathname === '/api/v1/newsletter/subscriptions/export') return new HttpResponse('email\nfan@example.com\n', { headers: { 'Content-Type': 'text/csv' } });
    }
    if (request.method === 'PATCH' && url.pathname === '/api/v1/orders/ORD-17/status') return HttpResponse.json({ ...order, status: url.searchParams.get('status') });
    if (request.method === 'PATCH' && url.pathname === '/api/v1/newsletter/subscriptions/31') return HttpResponse.json({ ...subscription, ...(body as object) });
    if (request.method === 'POST' && url.pathname === '/api/v1/categories') return HttpResponse.json({ id: 4, ...(body as object) }, { status: 201 });
    if (request.method === 'POST' && url.pathname === '/api/v1/brands') return HttpResponse.json({ id: 8, ...(body as object) }, { status: 201 });
    if (request.method === 'DELETE') return new HttpResponse(null, { status: 204 });
    if (request.method === 'POST') return HttpResponse.json({ id: 1, ...(body as object) }, { status: 201 });
    if (request.method === 'PUT') return HttpResponse.json({ id: 1, ...(body as object) });
    return HttpResponse.json({});
  }));
  return seen;
}

function renderPage(element: React.ReactElement, route = '/admin/page') {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/page" element={element} />
    </Routes>,
    { route }
  );
}

beforeEach(() => {
  localStorage.setItem('app_lang', 'en');
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Admin dashboard, products and users', () => {
  it('computes dashboard counts and recent-order revenue from loaded data', async () => {
    installAdminHandlers();
    renderPage(<AdminDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('ORD-17')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('searches products by query and shows the product table', async () => {
    const requests = installAdminHandlers();
    const userEventApi = userEvent.setup();
    renderPage(<AdminProductsPage />);

    expect(await screen.findByText('Carbon Rod')).toBeInTheDocument();
    await userEventApi.type(screen.getByPlaceholderText('Search products'), 'carbon');
    await userEventApi.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(requests.some((r) => r.path === '/api/v1/products' && r.query.get('q') === 'carbon')).toBe(true));
  });

  it('loads the paginated users table', async () => {
    installAdminHandlers();
    renderPage(<AdminUsersPage />);
    expect(await screen.findByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });
});

describe('Admin categories and brands', () => {
  it('creates a bilingual category and submits the mapper payload', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminCategoriesPage />);
    await screen.findByRole('heading', { name: 'New category' });

    await actor.type(screen.getByLabelText('Name (EN)'), 'Lures');
    await actor.type(screen.getByLabelText('Name (PT)'), 'Amostras');
    await actor.type(screen.getByLabelText('Slug'), 'lures');
    await actor.type(screen.getByLabelText('Description (EN)'), 'Fishing lures');
    await actor.type(screen.getByLabelText('Description (PT)'), 'Amostras de pesca');
    await actor.click(screen.getByRole('button', { name: 'New category' }));

    await waitFor(() => expect(requests.some((r) => r.method === 'POST' && r.path === '/api/v1/categories')).toBe(true));
    const sent = requests.find((r) => r.method === 'POST' && r.path === '/api/v1/categories');
    expect(sent?.body).toMatchObject({
      name: 'Lures',
      slug: 'lures',
      translations: { en: { name: 'Lures', description: 'Fishing lures' }, pt: { name: 'Amostras', description: 'Amostras de pesca' } },
    });
    expect(sent?.body).not.toHaveProperty('parentCategoryId');
  });

  it('creates a brand and omits an empty logo URL', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminBrandsPage />);
    await screen.findByText('Acme');

    await actor.type(screen.getByLabelText('Name'), 'Shimano');
    await actor.type(screen.getByLabelText('Slug'), 'shimano');
    await actor.click(screen.getByRole('button', { name: 'New brand' }));

    await waitFor(() => expect(requests.some((r) => r.method === 'POST' && r.path === '/api/v1/brands')).toBe(true));
    const sent = requests.find((r) => r.method === 'POST' && r.path === '/api/v1/brands');
    expect(sent?.body).toEqual({ name: 'Shimano', slug: 'shimano' });
  });
});

describe('Admin operations', () => {
  it('updates an order via the visible status action', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminOrdersPage />);

    expect(await screen.findByText('ORD-17')).toBeInTheDocument();
    await actor.click(screen.getAllByRole('button', { name: 'Paid' }).at(-1)!);
    await waitFor(() => expect(requests.some((r) => r.method === 'PATCH' && r.path === '/api/v1/orders/ORD-17/status')).toBe(true));
  });

  it('loads newsletter stats and toggles the subscriber status', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<AdminNewsletterPage />);

    expect(await screen.findByText('fan@example.com')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Unsubscribe' });
    await actor.click(toggle);
    await waitFor(() => expect(requests.some((r) => r.method === 'PATCH' && r.path === '/api/v1/newsletter/subscriptions/31')).toBe(true));
  });

  it('applies the inactive filter and a trimmed search term', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminNewsletterPage />);
    await screen.findByText('fan@example.com');

    await actor.click(screen.getByRole('button', { name: 'Inactive' }));
    await waitFor(() =>
      expect(requests.some((r) => r.path === '/api/v1/newsletter/subscriptions' && r.query.get('active') === 'false')).toBe(true)
    );
    await actor.type(screen.getByPlaceholderText('Search by email'), '  fan@example.com  ');
    await actor.keyboard('{Enter}');
    await waitFor(() =>
      expect(requests.some((r) => r.path === '/api/v1/newsletter/subscriptions' && r.query.get('q') === 'fan@example.com')).toBe(true)
    );
  });

  it('loads coupon and promotion management screens', async () => {
    installAdminHandlers();
    const { unmount: unmountCoupons } = renderPage(<AdminCouponsPage />);
    expect(await screen.findByRole('heading', { name: 'Coupons' })).toBeInTheDocument();
    unmountCoupons();

    installAdminHandlers();
    renderPage(<AdminPromotionsPage />);
    expect(await screen.findByRole('heading', { name: 'Promotions' })).toBeInTheDocument();
  });

  it('creates a coupon with blank optional numeric limits omitted', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminCouponsPage />);
    await screen.findByRole('heading', { name: 'Coupons' });

    await actor.type(screen.getByLabelText('Code'), 'SPRING10');
    await actor.clear(screen.getByLabelText('Discount value'));
    await actor.type(screen.getByLabelText('Discount value'), '10');
    fireEvent.change(screen.getByLabelText('Valid from'), { target: { value: '2026-03-01T00:00' } });
    fireEvent.change(screen.getByLabelText('Valid to'), { target: { value: '2026-06-01T00:00' } });
    await actor.click(screen.getByRole('button', { name: 'Create coupon' }));

    await waitFor(() =>
      expect(requests.some((r) => r.method === 'POST' && r.path === '/api/v1/coupons')).toBe(true)
    );
    const sent = requests.find((r) => r.method === 'POST' && r.path === '/api/v1/coupons');
    expect(sent?.body).toMatchObject({ code: 'SPRING10', discountType: 'PERCENTAGE', discountValue: 10 });
    expect(sent?.body).not.toHaveProperty('minOrderAmount');
    expect(sent?.body).not.toHaveProperty('usageLimit');
    expect(sent?.body).not.toHaveProperty('usageLimitPerUser');
  });

  it('creates a global promotion with no priority or target rules', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminPromotionsPage />);
    await screen.findByRole('heading', { name: 'Promotions' });

    await actor.type(screen.getByLabelText('Name'), 'Summer global');
    await actor.clear(screen.getByLabelText('Discount value'));
    await actor.type(screen.getByLabelText('Discount value'), '15');
    fireEvent.change(screen.getByLabelText('Valid from'), { target: { value: '2026-06-01T00:00' } });
    fireEvent.change(screen.getByLabelText('Valid to'), { target: { value: '2026-08-31T23:59' } });
    await actor.click(screen.getByRole('button', { name: 'Create promotion' }));

    await waitFor(() =>
      expect(requests.some((r) => r.method === 'POST' && r.path === '/api/v1/promotions')).toBe(true)
    );
    const sent = requests.find((r) => r.method === 'POST' && r.path === '/api/v1/promotions');
    expect(sent?.body).toMatchObject({ name: 'Summer global', discountValue: 15, rules: [] });
    expect(sent?.body).not.toHaveProperty('priority');
  });

  it('loads the stock form with purchasable variant options', async () => {
    installAdminHandlers();
    renderPage(<AdminStockPage />);
    expect(await screen.findByRole('heading', { name: 'Record movement' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /ROD-1/ })).toBeInTheDocument();
  });

  it('records a stock movement for the selected variant', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminStockPage />);
    await screen.findByRole('option', { name: /ROD-1/ });
    await actor.selectOptions(screen.getByLabelText('Select a product item'), '24');
    // Set the value directly: user-event cannot type a leading "-" into a number input in jsdom.
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '-2' } });
    await actor.selectOptions(screen.getByLabelText('Movement type'), 'ADJUSTMENT');
    await actor.type(screen.getByLabelText('Notes'), 'Damaged');
    await actor.click(screen.getByRole('button', { name: 'Record movement' }));

    await waitFor(() =>
      expect(requests.some((r) => r.method === 'POST' && r.path === '/api/v1/stock-movements')).toBe(true)
    );
    const sent = requests.find((r) => r.method === 'POST' && r.path === '/api/v1/stock-movements');
    expect(sent?.body).toEqual({ productItemId: 24, quantity: -2, type: 'ADJUSTMENT', notes: 'Damaged', userId: undefined });
  });

  it('rejects a zero stock movement', async () => {
    installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminStockPage />);
    await screen.findByRole('option', { name: /ROD-1/ });
    await actor.selectOptions(screen.getByLabelText('Select a product item'), '24');
    await actor.clear(screen.getByLabelText('Quantity'));
    await actor.type(screen.getByLabelText('Quantity'), '0');
    await actor.click(screen.getByRole('button', { name: 'Record movement' }));
    expect(await screen.findByText('Quantity cannot be zero')).toBeInTheDocument();
  });
});

describe('Admin pagination and error states', () => {
  it('pages through the user list', async () => {
    const requests = installAdminHandlers();
    server.use(http.get('/api/v1/users', ({ request }) => {
      const url = new URL(request.url);
      requests.push({ method: 'GET', path: url.pathname, query: url.searchParams, body: undefined });
      return HttpResponse.json(page([user], 60));
    }));
    const actor = userEvent.setup();
    renderPage(<AdminUsersPage />);
    await screen.findByText('ana@example.com');

    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    await actor.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() => expect(requests.some((r) => r.path === '/api/v1/users' && r.query.get('page') === '1')).toBe(true));
  });

  it('pages through admin orders and filters by status', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminOrdersPage />);
    await screen.findByText('ORD-17');

    // The first "Paid" button is the status filter, above the order rows.
    await actor.click(screen.getAllByRole('button', { name: 'Paid' })[0]);
    await waitFor(() => expect(requests.some((r) => r.path === '/api/v1/orders' && r.query.get('status') === 'PAID')).toBe(true));
  });

  it('surfaces a load failure with a translated message', async () => {
    server.use(http.get('/api/v1/products', () => HttpResponse.json({ message: 'Denied' }, { status: 403 })));
    renderPage(<AdminProductsPage />);
    expect(await screen.findByText(/permission to perform this action/)).toBeInTheDocument();
  });
});

describe('Admin product deletion', () => {
  it('asks for confirmation and deletes the product', async () => {
    const requests = installAdminHandlers();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const actor = userEvent.setup();
    renderPage(<AdminProductsPage />);
    await screen.findByText('Carbon Rod');

    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'DELETE' && r.path === '/api/v1/products/15')).toBe(true));
  });

  it('does nothing when the confirmation is declined', async () => {
    const requests = installAdminHandlers();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const actor = userEvent.setup();
    renderPage(<AdminProductsPage />);
    await screen.findByText('Carbon Rod');

    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    expect(requests.some((r) => r.method === 'DELETE')).toBe(false);
  });
});

describe('Admin newsletter actions', () => {
  it('exports the subscriber list as CSV', async () => {
    installAdminHandlers();
    // jsdom has no object-URL support; add just those two methods so the
    // global URL constructor (used by the request layer) keeps working.
    const createObjectURL = vi.fn(() => 'blob:csv');
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const actor = userEvent.setup();
    renderPage(<AdminNewsletterPage />);
    await screen.findByText('fan@example.com');

    await actor.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByText('CSV exported.')).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('resubscribes an inactive subscriber', async () => {
    const requests = installAdminHandlers();
    server.use(http.get('/api/v1/newsletter/subscriptions', () => HttpResponse.json(page([{ ...subscription, active: false }], 1))));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const actor = userEvent.setup();
    renderPage(<AdminNewsletterPage />);
    await screen.findByText('fan@example.com');

    await actor.click(screen.getByRole('button', { name: 'Resubscribe' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'PATCH' && r.path === '/api/v1/newsletter/subscriptions/31')).toBe(true));
    expect(await screen.findByText('Subscription updated.')).toBeInTheDocument();
  });

  it('deletes a subscriber after confirmation', async () => {
    const requests = installAdminHandlers();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const actor = userEvent.setup();
    renderPage(<AdminNewsletterPage />);
    await screen.findByText('fan@example.com');

    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'DELETE' && r.path === '/api/v1/newsletter/subscriptions/31')).toBe(true));
    expect(await screen.findByText('Subscription deleted.')).toBeInTheDocument();
  });

  it('shows an error when the subscriber list cannot load', async () => {
    installAdminHandlers();
    server.use(http.get('/api/v1/newsletter/subscriptions', () => HttpResponse.json({ message: 'Unavailable' }, { status: 503 })));
    renderPage(<AdminNewsletterPage />);
    expect(await screen.findByText(/Unavailable/)).toBeInTheDocument();
  });
});

describe('Admin category actions', () => {
  it('edits an existing category and cancels the edit', async () => {
    const requests = installAdminHandlers();
    const actor = userEvent.setup();
    renderPage(<AdminCategoriesPage />);
    await screen.findByRole('button', { name: 'Edit' });

    await actor.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Name (EN)')).toHaveValue('Rods');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Name (EN)')).toHaveValue('');

    await actor.click(screen.getByRole('button', { name: 'Edit' }));
    await actor.clear(screen.getByLabelText('Name (EN)'));
    await actor.type(screen.getByLabelText('Name (EN)'), 'Rods Pro');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(requests.some((r) => r.method === 'PUT' && r.path === '/api/v1/categories/3')).toBe(true));
  });

  it('deletes a category after confirmation', async () => {
    const requests = installAdminHandlers();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const actor = userEvent.setup();
    renderPage(<AdminCategoriesPage />);
    await screen.findByRole('button', { name: 'Delete' });

    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'DELETE' && r.path === '/api/v1/categories/3')).toBe(true));
  });
});

describe('Admin brand actions', () => {
  it('edits and deletes a brand', async () => {
    const requests = installAdminHandlers();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const actor = userEvent.setup();
    renderPage(<AdminBrandsPage />);
    await screen.findByText('Acme');

    await actor.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Acme');
    await actor.clear(screen.getByLabelText('Name'));
    await actor.type(screen.getByLabelText('Name'), 'Acme Pro');
    await actor.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'PUT' && r.path === '/api/v1/brands/7')).toBe(true));

    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'DELETE' && r.path === '/api/v1/brands/7')).toBe(true));
  });
});
