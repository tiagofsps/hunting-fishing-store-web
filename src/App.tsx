import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import NotFound from './components/NotFound';
import PlaceholderPage from './components/PlaceholderPage';
import HomePage from './features/home-page/components/HomePage';
import ShopPage from './features/catalog/components/ShopPage';
import ProductDetailPage from './features/product-detail/components/ProductDetailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<PlaceholderPage titleKey="common.placeholderCart" />} />
        <Route path="checkout" element={<PlaceholderPage titleKey="common.placeholderCheckout" />} />
        <Route path="order/:orderNumber" element={<PlaceholderPage titleKey="common.placeholderOrders" />} />
        <Route path="account" element={<PlaceholderPage titleKey="common.placeholderAccount" />} />
        <Route path="account/orders" element={<PlaceholderPage titleKey="common.placeholderOrders" />} />
        <Route path="account/orders/:orderNumber" element={<PlaceholderPage titleKey="common.placeholderOrders" />} />
        <Route path="admin/*" element={<PlaceholderPage titleKey="common.placeholderAdmin" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}