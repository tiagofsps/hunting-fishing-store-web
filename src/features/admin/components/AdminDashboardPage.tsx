import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listAllOrders, listUsers } from '../api';
import { getProductsPage } from '../../../lib/catalogApi';
import type { OrderResponse } from '../../../lib/ordersApi';
import { formatCurrency } from '../../../utils';
import { useLanguage } from '../../../i18n/useLanguage';

interface Stats {
  products: number;
  orders: number;
  users: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [products, orders, users] = await Promise.all([
          getProductsPage({ page: 0, size: 1 }),
          listAllOrders(0, 5),
          listUsers(0, 1),
        ]);
        if (cancelled) return;
        setStats({
          products: products.totalElements,
          orders: orders.totalElements,
          users: users.totalElements,
          revenue: orders.content.reduce((sum, order) => sum + order.totalAmount, 0),
        });
        setRecentOrders(orders.content);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: t('admin.statProducts'), value: stats?.products },
    { label: t('admin.statOrders'), value: stats?.orders },
    { label: t('admin.statUsers'), value: stats?.users },
    { label: t('admin.statRevenue'), value: stats ? formatCurrency(stats.revenue) : undefined },
  ];

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.dashboard')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.dashboardTitle')}</h2>
        <p className="mt-1 text-xs text-muted">{t('admin.dashboardSubtitle')}</p>
      </header>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-surface-raised p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-ink">
              {loading ? '…' : (card.value ?? '—')}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t('admin.recentOrders')}</h3>
        {recentOrders.length === 0 && !loading ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface-raised p-6 text-center text-xs font-bold text-muted">
            {t('admin.noRecentOrders')}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface-raised">
            {recentOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-muted">{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-strong">
                  {order.status}
                </span>
                <p className="text-sm font-black text-ink">{formatCurrency(order.totalAmount)}</p>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/admin/orders"
          className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-muted hover:text-ink"
        >
          {t('admin.orders')} →
        </Link>
      </section>
    </div>
  );
}
