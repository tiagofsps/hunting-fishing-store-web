import { vi } from 'vitest';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CartItem, Product } from '../types';
import { renderWithProviders } from '../test/renderWithProviders';
import CartDrawer from './CartDrawer';

const product: Product = {
  id: 15,
  name: 'Canonical Rod',
  slug: 'canonical-rod',
  description: '',
  translations: { pt: { name: 'Cana' } },
  categoryId: 1,
  brandId: 2,
  price: 50,
  imageUrl: '/images/rod.jpg',
};
const item: CartItem = {
  product,
  selectedItem: { id: 24, sku: 'ROD-1', price: 50, stockQuantity: 10 },
  quantity: 1,
};

function renderDrawer(overrides: Partial<React.ComponentProps<typeof CartDrawer>> = {}) {
  localStorage.setItem('app_lang', 'en');
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    cartItems: [item],
    onUpdateQuantity: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    onOpenCheckout: vi.fn(),
    ...overrides,
  };
  return { ...props, ...renderWithProviders(<CartDrawer {...props} />) };
}

describe('CartDrawer visibility and empty state', () => {
  it('renders nothing when closed', () => {
    renderDrawer({ isOpen: false });
    expect(screen.queryByRole('heading', { name: 'Your Cart' })).not.toBeInTheDocument();
  });

  it('shows the empty cart state and closes when the shopper continues', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer({ cartItems: [] });

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue Shopping' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('CartDrawer cart actions', () => {
  it('shows item count, price and free-shipping progress', () => {
    renderDrawer();
    expect(screen.getByRole('heading', { name: 'Your Cart' })).toBeInTheDocument();
    expect(screen.getByText(/1 item/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Canonical Rod' })).toHaveAttribute('src', '/images/rod.jpg');
    expect(screen.getByText(/54,95\s*€/)).toBeInTheDocument();
    expect(screen.getByText(/25,00\s*€/)).toBeInTheDocument();
  });

  it('names quantity and remove actions and passes product and variant details', async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity, onRemoveItem } = renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Increase quantity: Canonical Rod' }));
    await user.click(screen.getByRole('button', { name: 'Decrease quantity: Canonical Rod' }));
    await user.click(screen.getByRole('button', { name: 'Remove product: Canonical Rod' }));

    expect(onUpdateQuantity).toHaveBeenNthCalledWith(1, 15, 'ROD-1', 1);
    expect(onUpdateQuantity).toHaveBeenNthCalledWith(2, 15, 'ROD-1', -1);
    expect(onRemoveItem).toHaveBeenCalledWith(15, 'ROD-1');
  });

  it('closes before opening checkout and offers clear-cart and cart-page actions', async () => {
    const user = userEvent.setup();
    const { onClose, onOpenCheckout, onClearCart } = renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Complete Order' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onOpenCheckout).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Empty Cart' }));
    expect(onClearCart).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'View full cart' })).toHaveAttribute('href', '/cart');
  });

  it('shows the free-shipping achieved state at the threshold', () => {
    renderDrawer({ cartItems: [{ ...item, selectedItem: { ...item.selectedItem!, price: 75 } }] });
    expect(screen.getByText(/You have Free Shipping/)).toBeInTheDocument();
  });
});
