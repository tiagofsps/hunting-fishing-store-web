import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '../../../test/renderWithProviders';
import AdminLayout from './AdminLayout';

function renderLayout(path = '/admin/products') {
  return renderWithProviders(
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="products" element={<p>Products panel</p>} />
      </Route>
    </Routes>,
    { route: path }
  );
}

describe('AdminLayout', () => {
  beforeEach(() => localStorage.setItem('app_lang', 'en'));

  it('renders the console navigation and the routed panel', () => {
    renderLayout();
    expect(screen.getByRole('heading', { name: 'Admin Console' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to store/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/admin/products');
    expect(screen.getByText('Products panel')).toBeInTheDocument();
  });

  it('marks the active section', () => {
    renderLayout();
    expect(screen.getByRole('link', { name: 'Products' })).toHaveClass('bg-ink');
    expect(screen.getByRole('link', { name: 'Orders' })).not.toHaveClass('bg-ink');
  });
});
