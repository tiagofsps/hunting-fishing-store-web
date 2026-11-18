import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import HomePage from './features/home-page/components/HomePage';
import { useLanguage } from './i18n/useLanguage';
import { Spinner } from './components/ui/Spinner';

// Route-level code splitting keeps the initial bundle small; only the home
// page and the shared layout are part of the eager chunk.
const ShopPage = lazy(() => import('./features/catalog/components/ShopPage'));
const ProductDetailPage = lazy(() => import('./features/product-detail/components/ProductDetailPage'));
const CartPage = lazy(() => import('./features/cart/components/CartPage'));
const CheckoutPage = lazy(() => import('./features/checkout/components/CheckoutPage'));
const OrdersPage = lazy(() => import('./features/orders/components/OrdersPage'));
const OrderDetailPage = lazy(() => import('./features/orders/components/OrderDetailPage'));
const AccountPage = lazy(() => import('./features/account/components/AccountPage'));
const AdminLayout = lazy(() => import('./features/admin/components/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./features/admin/components/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./features/admin/components/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./features/admin/components/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./features/admin/components/AdminCategoriesPage'));
const AdminBrandsPage = lazy(() => import('./features/admin/components/AdminBrandsPage'));
const AdminStockPage = lazy(() => import('./features/admin/components/AdminStockPage'));
const AdminOrdersPage = lazy(() => import('./features/admin/components/AdminOrdersPage'));
const AdminCouponsPage = lazy(() => import('./features/admin/components/AdminCouponsPage'));
const AdminPromotionsPage = lazy(() => import('./features/admin/components/AdminPromotionsPage'));
const AdminNewsletterPage = lazy(() => import('./features/admin/components/AdminNewsletterPage'));
const AdminUsersPage = lazy(() => import('./features/admin/components/AdminUsersPage'));

function RouteFallback() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner label={t('common.loading')} />
        <p className="text-sm font-bold text-muted">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderNumber"
            element={
              <RequireAuth>
                <OrderDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route
            path="account/orders"
            element={
              <RequireAuth>
                <OrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="account/orders/:orderNumber"
            element={
              <RequireAuth>
                <OrderDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:id/edit" element={<AdminProductFormPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="stock" element={<AdminStockPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="promotions" element={<AdminPromotionsPage />} />
            <Route path="newsletter" element={<AdminNewsletterPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
