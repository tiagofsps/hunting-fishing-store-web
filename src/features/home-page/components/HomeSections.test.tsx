import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import BrandSection from './BrandSection';
import HeroSection from './HeroSection';
import ValuePropsSection from './ValuePropsSection';

describe('BrandSection', () => {
  it('renders nothing without brands', () => {
    const { container } = renderWithProviders(<BrandSection brands={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('links each brand to its filtered shop view and falls back to the name', () => {
    renderWithProviders(
      <BrandSection
        brands={[
          { id: 7, name: 'Acme', slug: 'acme', logoUrl: '/brands/acme.svg' },
          { id: 8, name: 'NoLogo', slug: 'nologo', logoUrl: 'https://example.com/logo.png' },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/shop?brandId=7');
    expect(screen.getByAltText('Acme')).toHaveAttribute('src', '/brands/acme.svg');
    // The placeholder logo URL is treated as "no logo" and the name is shown instead.
    expect(screen.getByRole('link', { name: 'NoLogo' })).toHaveTextContent('NoLogo');
    expect(screen.queryByAltText('NoLogo')).not.toBeInTheDocument();
  });
});

describe('HeroSection and ValuePropsSection', () => {
  it('renders the hero call to action', () => {
    renderWithProviders(<HeroSection />);
    expect(screen.getByRole('link', { name: 'Explore Gear' })).toHaveAttribute('href', '#featured');
  });

  it('renders the value propositions', () => {
    const { container } = renderWithProviders(<ValuePropsSection />);
    expect(container.textContent?.length).toBeGreaterThan(20);
  });
});
