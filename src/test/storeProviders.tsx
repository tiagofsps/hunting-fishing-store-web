import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../i18n/LanguageContext';
import AuthProvider from '../providers/AuthProvider';
import CartProvider from '../providers/CartProvider';
import { useAuth } from '../providers/useAuth';
import OverlayProvider from '../components/OverlayProvider';

function CartForCurrentUser({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <CartProvider userId={user?.id ?? null}>{children}</CartProvider>;
}

/** App-level providers used by routed storefront tests; API calls are intercepted by MSW. */
export function StoreProviders({ children, route = '/' }: { children: ReactNode; route?: string }) {
  return (
    <LanguageProvider>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <CartForCurrentUser>
            <OverlayProvider>{children}</OverlayProvider>
          </CartForCurrentUser>
        </AuthProvider>
      </MemoryRouter>
    </LanguageProvider>
  );
}
