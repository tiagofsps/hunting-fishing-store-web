import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/server';
import { StoreProviders } from '../../../test/storeProviders';
import type { ProductResponse } from '../../../lib/catalogApi';
import ShopPage from './ShopPage';

const product: ProductResponse = {
  id: 15,
  name: 'Carbon Rod',
  slug: 'carbon-rod',
  description: 'A rod',
  translations: null,
  requiresLicense: false,
  licenseType: null,
  categoryId: 3,
  brandId: 7,
  items: [{ id: 24, sku: 'ROD-1', price: 50, stockQuantity: 4, weight: null, active: true, attributes: {} }],
  images: [],
};
const page = (content: ProductResponse[], totalPages = 1) => ({
  content,
  totalElements: content.length,
  totalPages,
  number: 0,
  size: 20,
  first: true,
  last: totalPages <= 1,
  empty: content.length === 0,
});

function install(filters: { products?: ReturnType<typeof page> } = {}) {
  const requests: URL[] = [];
  server.use(
    http.get('/api/v1/products', ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(filters.products ?? page([product]));
    }),
    http.get('/api/v1/categories', () => HttpResponse.json([{ id: 3, name: 'Rods', slug: 'rods', description: '', translations: null, parentCategoryId: null, productCount: 4 }])),
    http.get('/api/v1/brands', () => HttpResponse.json([{ id: 7, name: 'Acme', slug: 'acme', logoUrl: '' }])),
    http.get('/api/v1/promotions', () => HttpResponse.json([]))
  );
  return requests;
}

function renderShop(route = '/shop') {
  return render(
    <StoreProviders route={route}>
      <Routes><Route path="/shop" element={<ShopPage />} /></Routes>
    </StoreProviders>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('app_lang', 'en');
});

describe('ShopPage filters', () => {
  it('filters by category and brand and sorts, updating the URL', async () => {
    const requests = install();
    const actor = userEvent.setup();
    renderShop();
    await screen.findByText('Carbon Rod');

    await actor.click(screen.getByRole('button', { name: 'Rods' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('categoryId')).toBe('3'));
    await actor.click(screen.getByRole('button', { name: 'Acme' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('brandId')).toBe('7'));
    await actor.selectOptions(screen.getByRole('combobox'), 'name');
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('sort')).toBe('name'));
    expect(requests.at(-1)?.searchParams.get('direction')).toBe('asc');
  });

  it('clears a single filter back to all', async () => {
    const requests = install();
    const actor = userEvent.setup();
    renderShop('/shop?categoryId=3&brandId=7');
    await screen.findByText('Carbon Rod');

    await actor.click(screen.getByRole('button', { name: 'All categories' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('categoryId')).toBe(false));
    await actor.click(screen.getByRole('button', { name: 'All brands' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('brandId')).toBe(false));
  });

  it('toggles the mobile filter panel', async () => {
    install();
    const actor = userEvent.setup();
    renderShop();
    await screen.findByText('Carbon Rod');

    const toggle = screen.getByRole('button', { name: 'Show filters' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await actor.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide filters' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('ShopPage states', () => {
  it('shows an empty state and clears filters from it', async () => {
    const requests = install({ products: page([], 0) });
    const actor = userEvent.setup();
    renderShop('/shop?q=nothing');
    expect(await screen.findByText('No products found')).toBeInTheDocument();

    await actor.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!);
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('q')).toBe(false));
  });

  it('shows an error state and retries', async () => {
    let calls = 0;
    server.use(
      http.get('/api/v1/products', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ message: 'Catalog down' }, { status: 503 })
          : HttpResponse.json(page([product]));
      }),
      http.get('/api/v1/categories', () => HttpResponse.json([])),
      http.get('/api/v1/brands', () => HttpResponse.json([])),
      http.get('/api/v1/promotions', () => HttpResponse.json([]))
    );
    const actor = userEvent.setup();
    renderShop();

    expect(await screen.findByText(/Catalog down/)).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Carbon Rod')).toBeInTheDocument();
  });

  it('pages through results', async () => {
    const requests = install({ products: page([product], 3) });
    const actor = userEvent.setup();
    renderShop();
    await screen.findByText('Carbon Rod');

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await actor.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('page')).toBe('1'));
  });

  it('adds to cart and opens the drawer, and opens quick view', async () => {
    install();
    const actor = userEvent.setup();
    renderShop();
    await screen.findByText('Carbon Rod');

    await actor.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: 'Close cart' }));

    await actor.click(screen.getByRole('button', { name: 'Quick View: Carbon Rod' }));
    expect(await screen.findByRole('heading', { name: 'Carbon Rod' })).toBeInTheDocument();
  });
});
