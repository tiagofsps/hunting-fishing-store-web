import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { StoreProviders } from '../../test/storeProviders';
import type { ProductResponse } from '../../lib/catalogApi';
import HomePage from '../home-page/components/HomePage';
import ShopPage from '../catalog/components/ShopPage';
import ProductDetailPage from '../product-detail/components/ProductDetailPage';

const product: ProductResponse = {
  id: 15,
  name: 'Carbon Rod',
  slug: 'carbon-rod',
  description: 'A light carbon fishing rod',
  translations: { pt: { name: 'Cana de Carbono', description: 'Uma cana de pesca leve' } },
  requiresLicense: false,
  licenseType: null,
  categoryId: 3,
  brandId: 7,
  items: [{ id: 24, sku: 'ROD-1', price: 50, stockQuantity: 8, weight: 0.5, active: true, attributes: { size: 'M' } }],
  images: [{ id: 31, imageUrl: '/images/rod.jpg', altText: null, isPrimary: true, displayOrder: 0 }],
};
const productPage = { content: [product], totalElements: 1, totalPages: 1, number: 0, size: 20, first: true, last: true, empty: false };

function installCatalog() {
  server.use(
    http.get('/api/v1/products', () => HttpResponse.json(productPage)),
    http.get('/api/v1/products/15', () => HttpResponse.json(product)),
    http.get('/api/v1/categories', () => HttpResponse.json([{ id: 3, name: 'Rods', slug: 'rods', description: 'Fishing rods', translations: { pt: { name: 'Canas' } }, parentCategoryId: null, productCount: 1 }])),
    http.get('/api/v1/brands', () => HttpResponse.json([{ id: 7, name: 'Acme', slug: 'acme', logoUrl: '/brands/acme.svg' }])),
    http.get('/api/v1/promotions', () => HttpResponse.json([]))
  );
}

function renderStore(path: string, pattern: string, element: ReactNode) {
  return render(
    <StoreProviders route={path}>
      <Routes><Route path={pattern} element={element} /></Routes>
    </StoreProviders>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('loads featured products and opens the cart after adding one', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderStore('/', '/', <HomePage />);

    expect((await screen.findAllByRole('link', { name: 'Carbon Rod' }))[0]).toHaveAttribute('href', '/product/15');
    await actor.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
    expect(screen.getAllByText('Carbon Rod').length).toBeGreaterThan(0);
  });
});

describe('ShopPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('loads the catalog, searches, and clears URL-backed filters', async () => {
    installCatalog();
    const requests: URL[] = [];
    server.use(http.get('/api/v1/products', ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(productPage);
    }));
    const actor = userEvent.setup();
    renderStore('/shop?q=rod&categoryId=3', '/shop', <ShopPage />);

    expect((await screen.findAllByRole('link', { name: 'Carbon Rod' })).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Clear filters/ })).toBeInTheDocument();
    await actor.type(screen.getByPlaceholderText(/Search/), ' carbon');
    await actor.keyboard('{Enter}');
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('q')).toBe('rod carbon'));
    expect(requests.at(-1)?.searchParams.get('categoryId')).toBe('3');
    await actor.click(screen.getByRole('button', { name: /Clear filters/ }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('categoryId')).toBe(false));
  });
});

describe('ProductDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('app_lang', 'en');
  });

  it('shows the product and adds its selected variant to the cart', async () => {
    installCatalog();
    const actor = userEvent.setup();
    renderStore('/product/15', '/product/:id', <ProductDetailPage />);

    expect(await screen.findByRole('heading', { name: 'Carbon Rod' })).toBeInTheDocument();
    expect(screen.getByText('A light carbon fishing rod')).toBeInTheDocument();
    expect(screen.getAllByText('ROD-1').length).toBeGreaterThan(0);
    await actor.click(screen.getByRole('button', { name: /Add to Cart/ }));
    expect(await screen.findByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
    expect(screen.getAllByText('Carbon Rod').length).toBeGreaterThan(0);
  });

  it('renders a not-found state when the product request fails', async () => {
    server.use(
      http.get('/api/v1/products/999', () => HttpResponse.json({ message: 'Not found' }, { status: 404 })),
      http.get('/api/v1/categories', () => HttpResponse.json([])),
      http.get('/api/v1/brands', () => HttpResponse.json([])),
      http.get('/api/v1/promotions', () => HttpResponse.json([]))
    );
    renderStore('/product/999', '/product/:id', <ProductDetailPage />);
    expect(await screen.findByText('Product not found')).toBeInTheDocument();
  });
});
