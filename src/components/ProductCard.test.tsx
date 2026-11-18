import { vi } from 'vitest';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Product, Promotion } from '../types';
import { renderWithProviders } from '../test/renderWithProviders';
import ProductCard from './ProductCard';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 15,
    name: 'Canonical Rod',
    slug: 'canonical-rod',
    description: 'A light fishing rod',
    translations: { pt: { name: 'Cana', description: 'Uma cana leve' } },
    categoryId: 1,
    brandId: 2,
    price: 50,
    imageUrl: '/images/rod.jpg',
    stockQuantity: 4,
    requiresLicense: false,
    ...overrides,
  };
}

describe('ProductCard', () => {
  it('shows localized copy, stock and price and links to the product', () => {
    localStorage.setItem('app_lang', 'pt');
    renderWithProviders(
      <ProductCard product={makeProduct()} onAddToCart={vi.fn()} onQuickView={vi.fn()} />
    );

    expect(screen.getAllByRole('link', { name: 'Cana' })[0]).toHaveAttribute('href', '/product/15');
    expect(screen.getByText('Uma cana leve')).toBeInTheDocument();
    expect(screen.getByAltText('Cana')).toHaveAttribute('src', '/images/rod.jpg');
    expect(screen.getByText(/4/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar ao Cesto' })).toBeEnabled();
  });

  it('disables add to cart and shows the sold-out badge when stock is zero', () => {
    localStorage.setItem('app_lang', 'en');
    renderWithProviders(
      <ProductCard product={makeProduct({ stockQuantity: 0 })} onAddToCart={vi.fn()} onQuickView={vi.fn()} />
    );

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
    expect(screen.queryByText(/in stock/i)).not.toBeInTheDocument();
  });

  it('shows a sale price and licence badge when applicable', () => {
    localStorage.setItem('app_lang', 'en');
    const promotions: Promotion[] = [{
      id: 1,
      title: 'Sale',
      description: '',
      discountPercentage: 20,
      active: true,
      rules: [{ targetType: 'PRODUCT', targetId: 15 }],
    }];
    renderWithProviders(
      <ProductCard product={makeProduct({ requiresLicense: true })} promotions={promotions} onAddToCart={vi.fn()} onQuickView={vi.fn()} />
    );

    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(screen.getByText('License Req.')).toBeInTheDocument();
    expect(screen.getByText(/40,00\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/50,00\s*€/)).toHaveClass('line-through');
  });

  it('invokes the add-to-cart and quick-view callbacks with the product', async () => {
    localStorage.setItem('app_lang', 'en');
    const user = userEvent.setup();
    const item = makeProduct();
    const add = vi.fn();
    const quickView = vi.fn();
    renderWithProviders(<ProductCard product={item} onAddToCart={add} onQuickView={quickView} />);

    await user.click(screen.getByRole('button', { name: 'Add to Cart' }));
    await user.click(screen.getByRole('button', { name: 'Quick View: Canonical Rod' }));

    expect(add).toHaveBeenCalledWith(item);
    expect(quickView).toHaveBeenCalledWith(item);
  });
});
