import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from '../i18n/LanguageContext';
import AuthProvider from '../providers/AuthProvider';

interface Options extends Omit<RenderOptions, 'wrapper'> {
  /** Initial in-memory route, for components that read params or navigate. */
  route?: string;
  /** Install the real auth provider, which restores the session through MSW. */
  auth?: boolean;
}

export function createProvidersWrapper({
  route = '/',
  routePattern,
  auth = false,
}: Pick<Options, 'route' | 'auth'> & { routePattern?: string } = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const content = routePattern ? (
      <Routes>
        <Route path={routePattern} element={<>{children}</>} />
      </Routes>
    ) : (
      children
    );
    const routed = <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
    return (
      <LanguageProvider>
        {auth ? <AuthProvider>{routed}</AuthProvider> : routed}
      </LanguageProvider>
    );
  };
}

/**
 * Renders a component inside the same providers the app uses for language and
 * routing. Auth and cart providers are added per test where needed.
 */
export function renderWithProviders(ui: ReactElement, { route = '/', auth = false, ...options }: Options = {}) {
  const Wrapper = createProvidersWrapper({ route, auth });
  return render(ui, { wrapper: Wrapper, ...options });
}
