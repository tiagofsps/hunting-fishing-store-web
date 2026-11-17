import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../i18n/LanguageContext';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Initial in-memory route, for components that read params or navigate. */
  route?: string;
}

/**
 * Renders a component inside the same providers the app uses for language and
 * routing. Auth and cart providers are added per test where needed.
 */
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LanguageProvider>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </LanguageProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
