import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import AuthProvider from '../features/auth/AuthProvider';
import CartProvider from '../features/cart/CartProvider';
import OverlayProvider from './OverlayProvider';
import PromotionBanner from '../features/home-page/components/PromotionBanner';
import Navbar from './navbar';
import Footer from './footer';
import { useAuth } from '../features/auth/hooks';

function Shell() {
  const { user } = useAuth();

  return (
    <CartProvider userId={user?.id ?? null}>
      <OverlayProvider>
        <PromotionBanner />
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </OverlayProvider>
    </CartProvider>
  );
}

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </div>
  );
}