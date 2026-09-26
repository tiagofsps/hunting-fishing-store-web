import { Link, useNavigate } from 'react-router';
import { useCart } from '../hooks';
import { useAuth } from '../../auth/hooks';
import { useOverlays } from '../../../components/overlay-context';
import { formatCurrency, getProductImageUrl, getProductPrice } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';

/** Display-only estimate; the backend computes the authoritative order total. */
const FREE_SHIPPING_THRESHOLD = 75;
const SHIPPING_FEE = 4.95;

export default function CartPage() {
  const { t } = useLanguage();
  const { cartItems, updateQuantity, removeItem, clearCart, totalCount, subtotal } = useCart();
  const { user } = useAuth();
  const { openAuth } = useOverlays();
  const navigate = useNavigate();

  const shipping = cartItems.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!user) {
      openAuth();
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <svg className="mb-4 h-16 w-16 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{t('cart.emptyTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('cart.emptyDesc')}</p>
        <Link
          to="/shop"
          className="mt-8 rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
        >
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">{t('cart.title')}</h1>
            <p className="mt-1 text-sm font-bold text-muted">
              {totalCount} {totalCount === 1 ? t('cart.itemSingular') : t('cart.itemPlural')}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-body hover:bg-surface-hover hover:text-sale"
          >
            {t('cart.clearCart')}
          </button>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          {/* Line items */}
          <ul className="space-y-4">
            {cartItems.map((item) => {
              const sku = item.selectedItem?.sku;
              const unitPrice = item.selectedItem ? item.selectedItem.price : getProductPrice(item.product);
              const availableStock = item.selectedItem?.stockQuantity ?? item.product.stockQuantity;
              return (
                <li
                  key={`${item.product.id}-${sku ?? 'default'}`}
                  className="flex gap-4 rounded-3xl border border-border bg-surface-raised p-4"
                >
                  <Link
                    to={`/product/${item.product.id}`}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface"
                  >
                    <img src={getProductImageUrl(item.product)} alt={item.product.name} className="h-full w-full object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.product.id}`}
                          className="block truncate text-sm font-bold text-ink hover:text-accent-strong"
                        >
                          {item.product.name}
                        </Link>
                        {sku && (
                          <p className="mt-0.5 text-xs text-muted">
                            {t('cart.variant')}: {sku}
                          </p>
                        )}
                        {typeof availableStock === 'number' && (
                          <p className={`mt-0.5 text-xs font-bold ${availableStock > 0 ? 'text-accent-strong' : 'text-sale'}`}>
                            {availableStock} {t('pdp.units')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, sku)}
                        title={t('cart.removeTooltip')}
                        className="shrink-0 text-muted transition-colors hover:text-sale"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-3">
                      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, sku, -1)}
                          className="flex h-6 w-6 items-center justify-center font-bold text-body hover:text-ink"
                          aria-label="-"
                        >
                          −
                        </button>
                        <span className="min-w-5 text-center text-sm font-black text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, sku, 1)}
                          className="flex h-6 w-6 items-center justify-center font-bold text-body hover:text-ink"
                          aria-label="+"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-ink">{formatCurrency(unitPrice * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-muted">
                            {formatCurrency(unitPrice)} {t('cart.each')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary */}
          <aside className="h-fit rounded-3xl border border-border bg-surface-raised p-6 lg:sticky lg:top-32">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('cart.orderSummary')}</h2>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between text-body">
                <dt>{t('cart.subtotal')}</dt>
                <dd className="font-bold text-ink">{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-body">
                <dt>{t('cart.shipping')}</dt>
                <dd className={`font-bold ${shipping === 0 ? 'text-accent-strong' : 'text-ink'}`}>
                  {shipping === 0 ? t('cart.shippingFree') : formatCurrency(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-black text-ink">
                <dt>{t('cart.total')}</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
            </dl>

            <button
              onClick={handleCheckout}
              className="mt-6 w-full rounded-xl bg-ink py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {user ? t('cart.checkoutButton') : t('cart.loginToCheckout')}
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <Link
              to="/shop"
              className="mt-4 block text-center text-xs font-bold text-muted transition-colors hover:text-accent-strong"
            >
              {t('cart.continueShopping')}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}