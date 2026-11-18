import { Link } from 'react-router';
import { useOrders } from '../hooks';
import { formatCurrency } from '../../../utils';
import type { OrderStatus } from '../../../lib/ordersApi';
import { useLanguage } from '../../../i18n/useLanguage';
import { Spinner } from '../../../components/ui/Spinner';

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-accent/20 text-ink',
  PAID: 'bg-accent-strong/15 text-accent-strong',
  SHIPPED: 'bg-accent-strong/15 text-accent-strong',
  DELIVERED: 'bg-accent-strong text-ink',
  CANCELLED: 'bg-sale/15 text-sale',
};

export default function OrdersPage() {
  const { t } = useLanguage();
  const { orders, loading, error, reload } = useOrders();

  return (
    <div className="bg-surface py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
        <header className="border-b border-border pb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('orders.subtitle')}</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{t('orders.title')}</h1>
        </header>

        {loading ? (
          <div className="flex h-80 flex-col items-center justify-center gap-4">
            <Spinner label={t('common.loading')} />
            <p className="text-sm font-bold text-muted">{t('orders.loading')}</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-sale/30 bg-sale/10 p-8 text-center">
            <p className="font-bold text-sale">
              {t('orders.errorTitle')} {error}
            </p>
            <button
              onClick={reload}
              className="mt-6 rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
            >
              {t('orders.retry')}
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-surface-raised p-12 text-center">
            <svg className="mx-auto mb-3 h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-bold text-ink">{t('orders.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('orders.emptyDesc')}</p>
            <Link
              to="/shop"
              className="mt-6 inline-block rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink/90"
            >
              {t('orders.continueShopping')}
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/account/orders/${order.orderNumber}`}
                  className="block rounded-3xl border border-border bg-surface-raised p-5 transition-all hover:border-accent-border hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('orders.orderNumber')}</p>
                      <p className="mt-0.5 truncate text-sm font-black text-ink">{order.orderNumber}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('orders.date')}</p>
                      <p className="mt-0.5 text-sm font-bold text-ink">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('orders.itemsCount').replace('{count}', String(order.items.length))}</p>
                      <p className="mt-0.5 text-sm font-bold text-ink">{t('cart.total')}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('orders.status')}</p>
                      <span className={`mt-0.5 inline-block rounded-full px-3 py-1 text-[11px] font-black ${STATUS_STYLES[order.status]}`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-base font-black text-ink">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
