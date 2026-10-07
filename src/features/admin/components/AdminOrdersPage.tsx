import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  listAllOrders,
  listOrdersByStatus,
  updateOrderStatus,
  ALLOWED_TRANSITIONS,
} from '../api';
import type { OrderResponse, OrderStatus } from '../../../lib/ordersApi';
import { formatCurrency } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';
import { useAdminError } from '../hooks';

const PAGE_SIZE = 20;
const STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const describeError = useAdminError();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const page = Number(searchParams.get('page') ?? '0');
  const statusFilter = (searchParams.get('status') ?? '') as OrderStatus | '';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = statusFilter
          ? await listOrdersByStatus(page, PAGE_SIZE, statusFilter)
          : await listAllOrders(page, PAGE_SIZE);
        if (cancelled) return;
        setOrders(data.content);
        setTotal(data.totalElements);
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, reloadToken, describeError]);

  const updateParams = (next: Record<string, string>) => setSearchParams(next);

  const handleStatusChange = async (order: OrderResponse, next: OrderStatus) => {
    setError('');
    setNotice('');
    setPendingId(order.id);
    try {
      await updateOrderStatus(order.orderNumber, next);
      setNotice(t('admin.statusUpdated'));
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPendingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.orders')}</span>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.ordersTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('admin.ordersSubtitle')}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t('admin.revenue')}</p>
          <p className="text-2xl font-black text-ink">{formatCurrency(revenue)}</p>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => updateParams({ page: '0' })}
          className={`rounded-lg border px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${
            statusFilter === '' ? 'border-accent-strong bg-accent-strong text-ink' : 'border-border text-muted'
          }`}
        >
          {t('admin.allStatuses')}
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => updateParams({ status, page: '0' })}
            className={`rounded-lg border px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${
              statusFilter === status ? 'border-accent-strong bg-accent-strong text-ink' : 'border-border text-muted'
            }`}
          >
            {t(`orders.status.${status}`)}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}
      {notice && (
        <p className="mt-6 rounded-xl border border-accent-border bg-accent/10 p-3 text-xs font-bold text-accent-strong">
          {notice}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="rounded-2xl border border-border bg-surface-raised px-5 py-10 text-center text-xs font-bold text-muted">
            {t('common.loading')}
          </p>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface-raised px-5 py-10 text-center text-xs font-bold text-muted">
            {t('admin.noRecentOrders')}
          </p>
        ) : (
          orders.map((order) => {
            const transitions = ALLOWED_TRANSITIONS[order.status];
            return (
              <div key={order.id} className="rounded-2xl border border-border bg-surface-raised p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/account/orders/${order.orderNumber}`}
                      className="text-sm font-black text-ink hover:text-accent-strong"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-[10px] text-muted">
                      {new Date(order.orderDate).toLocaleString()} ·{' '}
                      {t('admin.orderItemsCount').replace('{count}', String(order.items.length))}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {order.shippingAddress.recipientName}, {order.shippingAddress.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-strong">
                    {t(`orders.status.${order.status}`)}
                  </span>
                  <p className="text-base font-black text-ink">{formatCurrency(order.totalAmount)}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    {t('admin.updateStatus')}
                  </span>
                  {transitions.length === 0 ? (
                    <span className="text-[10px] font-bold text-muted">{t('admin.noStatusChange')}</span>
                  ) : (
                    transitions.map((next) => (
                      <button
                        key={next}
                        disabled={pendingId === order.id}
                        onClick={() => void handleStatusChange(order, next)}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface-hover disabled:opacity-50"
                      >
                        {t(`orders.status.${next}`)}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs font-bold text-muted">
            {t('shop.pageOf').replace('{current}', String(page + 1)).replace('{total}', String(totalPages))}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => updateParams({ ...(statusFilter ? { status: statusFilter } : {}), page: String(page - 1) })}
              className="rounded-lg border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink disabled:opacity-40"
            >
              ← {t('shop.previous')}
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => updateParams({ ...(statusFilter ? { status: statusFilter } : {}), page: String(page + 1) })}
              className="rounded-lg border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink disabled:opacity-40"
            >
              {t('shop.next')} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
