import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { Product } from '../../../types';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { server } from '../../../test/server';
import ProductSection from './ProductSection';
import QuickViewModal from './QuickViewModal';
import CTASection from './CTASection';

function makeProduct(id: number, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name: `Rod ${id}`,
    slug: `rod-${id}`,
    description: `Description ${id}`,
    categoryId: 3,
    brandId: 7,
    price: 20,
    imageUrl: `/images/${id}.jpg`,
    stockQuantity: 4,
    requiresLicense: false,
    ...overrides,
  };
}

describe('ProductSection', () => {
  it('renders no section when there are no products', () => {
    const { container } = renderWithProviders(<ProductSection products={[]} onAddToCart={vi.fn()} onQuickView={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows at most eight products and links to the full shop', () => {
    const products = Array.from({ length: 10 }, (_, index) => makeProduct(index + 1));
    renderWithProviders(<ProductSection products={products} onAddToCart={vi.fn()} onQuickView={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Featured Products & Gear' })).toBeInTheDocument();
    expect(screen.getAllByAltText(/Rod/)).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'View all products' })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('button', { name: 'Previous products' })).toBeDisabled();
  });
});

describe('QuickViewModal', () => {
  it('renders nothing without a selected product', () => {
    const { container } = renderWithProviders(<QuickViewModal product={null} onClose={vi.fn()} onAddToCart={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('switches gallery images, variants and adds the selected variant to cart', async () => {
    const actor = userEvent.setup();
    const item = makeProduct(15, {
      images: [
        { id: 1, imageUrl: '/images/front.jpg', altText: 'Front', isPrimary: true, displayOrder: 0 },
        { id: 2, imageUrl: '/images/side.jpg', altText: 'Side', isPrimary: false, displayOrder: 1 },
      ],
      items: [
        { id: 24, sku: 'ROD-S', price: 20, stockQuantity: 4, active: true, attributes: { size: 'Small' } },
        { id: 25, sku: 'ROD-L', price: 30, stockQuantity: 2, active: true, attributes: { size: 'Large' } },
      ],
    });
    const onAddToCart = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<QuickViewModal product={item} onClose={onClose} onAddToCart={onAddToCart} />);

    expect(screen.getByRole('heading', { name: 'Rod 15' })).toBeInTheDocument();
    await actor.click(screen.getByRole('button', { name: /Thumb 1/ }));
    expect(screen.getByAltText('Rod 15')).toHaveAttribute('src', '/images/side.jpg');
    await actor.click(screen.getByRole('button', { name: /Large/ }));
    await actor.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(onAddToCart).toHaveBeenCalledWith(item, expect.objectContaining({ id: 25, sku: 'ROD-L' }));
    expect(await screen.findByText('Added to Cart!')).toBeInTheDocument();

    await actor.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('disables add-to-cart for the selected out-of-stock variant', () => {
    const item = makeProduct(15, { items: [{ id: 24, sku: 'ROD-0', price: 20, stockQuantity: 0, active: true }] });
    renderWithProviders(<QuickViewModal product={item} onClose={vi.fn()} onAddToCart={vi.fn()} />);
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
  });
});

describe('CTASection newsletter form', () => {
  it('validates email locally and does not submit invalid values', async () => {
    const actor = userEvent.setup();
    const requests: string[] = [];
    server.use(http.post('/api/v1/newsletter/subscribe', ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({});
    }));
    renderWithProviders(<CTASection />);

    await actor.type(screen.getByPlaceholderText('Your email address'), 'not-email');
    fireEvent.submit(screen.getByRole('button', { name: 'Subscribe' }).closest('form')!);
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('shows success after subscribing', async () => {
    const actor = userEvent.setup();
    let body: unknown;
    server.use(http.post('/api/v1/newsletter/subscribe', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ id: 1, email: 'fan@example.com', active: true }, { status: 201 });
    }));
    renderWithProviders(<CTASection />);

    await actor.type(screen.getByPlaceholderText('Your email address'), 'fan@example.com');
    await actor.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Thank you for subscribing!')).toBeInTheDocument();
    expect(body).toEqual({ email: 'fan@example.com' });
  });

  it('shows a translated conflict message when already subscribed', async () => {
    const actor = userEvent.setup();
    server.use(http.post('/api/v1/newsletter/subscribe', () => HttpResponse.json({ message: 'Conflict' }, { status: 409 })));
    renderWithProviders(<CTASection />);

    await actor.type(screen.getByPlaceholderText('Your email address'), 'fan@example.com');
    await actor.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText(/already subscribed/i)).toBeInTheDocument();
  });
});
