import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import PlaceholderPage from './components/PlaceholderPage';
import RequireAuth from './components/RequireAuth';
import HomePage from './features/home-page/components/HomePage';
import ShopPage from './features/catalog/components/ShopPage';
import ProductDetailPage from './features/product-detail/components/ProductDetailPage';
import CartPage from './features/cart/components/CartPage';
import CheckoutPage from './features/checkout/components/CheckoutPage';
import OrdersPage from './features/orders/components/OrdersPage';
import OrderDetailPage from './features/orders/components/OrderDetailPage';
import AccountPage from './features/account/components/AccountPage';

export default function App() {
  return (
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
        <Route path="admin/*" element={<PlaceholderPage titleKey="common.placeholderAdmin" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}