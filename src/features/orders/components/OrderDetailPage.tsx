import { Link } from 'react-router';
import { useOrderDetail } from '../hooks';
import { formatCurrency } from '../../../utils';
import type { OrderStatus } from '../../../lib/ordersApi';
import type { Address } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';
import { Spinner } from '../../../components/ui/Spinner';

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-accent/20 text-ink',
  PAID: 'bg-accent-strong/15 text-accent-strong',
  SHIPPED: 'bg-accent-strong/15 text-accent-strong',
  DELIVERED: 'bg-accent-strong text-ink',
  CANCELLED: 'bg-sale/15 text-sale',
};

function AddressCard({ label, address }: { label: string; address: Address }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</h3>
      <p className="mt-2 text-sm font-bold text-ink">{address.recipientName}</p>
      <p className="text-xs text-muted">{address.recipientPhone}</p>
      <p className="mt-1 text-xs text-muted">
        {address.street}, {address.postalCode} {address.city}
      </p>
      <p className="text-xs text-muted">{address.countryCode}</p>
    </div>
  );
}

export default function OrderDetailPage() {
  const { t } = useLanguage();
  const { order, payment, loading, error, reload } = useOrderDetail();

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner label={t('common.loading')} />
        <p className="text-sm font-bold text-muted">{t('orders.loading')}</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
        <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{t('orders.notFoundTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{error ?? t('orders.notFoundDesc')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {error && (
            <button
              onClick={reload}
              className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
            >
              {t('orders.retry')}
            </button>
          )}
          <Link
            to="/account/orders"
            className="rounded-xl border border-border bg-surface-raised px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
          >
            {t('orders.backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
        <Link
          to="/account/orders"
          className="text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-accent-strong"
        >
          ← {t('orders.backToOrders')}
        </Link>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('orders.orderNumber')}</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-ink sm:text-4xl">{order.orderNumber}</h1>
            <p className="mt-1 text-xs font-bold text-muted">{new Date(order.orderDate).toLocaleString()}</p>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-xs font-black ${STATUS_STYLES[order.status]}`}>
            {t(`orders.status.${order.status}`)}
          </span>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AddressCard label={t('orders.shippingAddress')} address={order.shippingAddress} />
          <AddressCard label={t('orders.billingAddress')} address={order.billingAddress} />
        </div>

        {/* Items */}
        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('orders.orderItems')}</h2>
          <ul className="mt-4 divide-y divide-border rounded-3xl border border-border bg-surface-raised">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{item.productName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t('cart.variant')}: {item.sku} · {formatCurrency(item.unitPrice)} {t('cart.each')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-ink">{formatCurrency(item.subTotal)}</p>
                  <p className="text-xs text-muted">x{item.quantity}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Totals */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-surface-raised p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('cart.orderSummary')}</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-body">
                <dt>{t('cart.subtotal')}</dt>
                <dd className="font-bold text-ink">{formatCurrency(order.subtotalAmount)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-accent-strong">
                  <dt>{t('orders.discount')}</dt>
                  <dd className="font-bold">−{formatCurrency(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-body">
                <dt>{t('cart.shipping')}</dt>
                <dd className={`font-bold ${order.shippingCost === 0 ? 'text-accent-strong' : 'text-ink'}`}>
                  {order.shippingCost === 0 ? t('cart.shippingFree') : formatCurrency(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-black text-ink">
                <dt>{t('cart.total')}</dt>
                <dd>{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-border bg-surface-raised p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{t('orders.payment')}</h2>
            {payment ? (
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-body">
                  <dt>{t('orders.paymentMethod')}</dt>
                  <dd className="font-bold text-ink">{payment.paymentMethod}</dd>
                </div>
                <div className="flex justify-between text-body">
                  <dt>{t('orders.paymentStatus')}</dt>
                  <dd className="font-bold text-ink">{payment.status}</dd>
                </div>
                <div className="flex justify-between text-body">
                  <dt>{t('cart.total')}</dt>
                  <dd className="font-bold text-ink">{formatCurrency(payment.amount)}</dd>
                </div>
                {payment.multibancoEntity && (
                  <div className="flex justify-between text-body">
                    <dt>{t('checkout.multibancoEntity')}</dt>
                    <dd className="font-bold text-ink">{payment.multibancoEntity}</dd>
                  </div>
                )}
                {payment.multibancoReference && (
                  <div className="flex justify-between text-body">
                    <dt>{t('checkout.multibancoRef')}</dt>
                    <dd className="font-bold text-ink">{payment.multibancoReference}</dd>
                  </div>
                )}
                {payment.paymentUrl && (
                  <a
                    href={payment.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block rounded-xl bg-ink px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
                  >
                    {t('checkout.paymentUrl')}
                  </a>
                )}
                <p className="pt-2 text-[11px] leading-relaxed text-muted">{t('orders.paymentLocalNotice')}</p>
              </dl>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-muted">{t('orders.paymentLocalNotice')}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
