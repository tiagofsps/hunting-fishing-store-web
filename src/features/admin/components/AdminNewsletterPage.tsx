import { useEffect, useState } from 'react';
import {
  listSubscriptions,
  unsubscribe,
  type NewsletterSubscription,
} from '../api';
import { useLanguage } from '../../../i18n/useLanguage';

const PAGE_SIZE = 20;

export default function AdminNewsletterPage() {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listSubscriptions(page, PAGE_SIZE);
        if (cancelled) return;
        setSubscriptions(data.content);
        setTotal(data.totalElements);
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
  }, [page, reloadToken]);

  const handleUnsubscribe = async (subscription: NewsletterSubscription) => {
    if (!window.confirm(`${t('admin.unsubscribeConfirm')} ${subscription.email}`)) return;
    setError('');
    setNotice('');
    try {
      await unsubscribe(subscription.email);
      setNotice(t('admin.movementRecorded'));
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.newsletter')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.newsletterTitle')}</h2>
        <p className="mt-1 text-xs text-muted">{t('admin.newsletterSubtitle')}</p>
      </header>

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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.email')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.subscribedAt')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.active')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('admin.unsubscribe')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center font-bold text-muted">
                  {t('admin.noSubscriptions')}
                </td>
              </tr>
            ) : (
              subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3 font-bold text-ink">{subscription.email}</td>
                  <td className="px-5 py-3 text-muted">
                    {new Date(subscription.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        subscription.active ? 'bg-accent-strong/15 text-accent-strong' : 'bg-sale/15 text-sale'
                      }`}
                    >
                      {subscription.active ? t('admin.active') : t('admin.cancel')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => void handleUnsubscribe(subscription)}
                      className="rounded-lg border border-sale/40 bg-sale/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sale hover:bg-sale/20"
                    >
                      {t('admin.unsubscribe')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs font-bold text-muted">
            {t('shop.pageOf').replace('{current}', String(page + 1)).replace('{total}', String(totalPages))}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink disabled:opacity-40"
            >
              ← {t('shop.previous')}
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((current) => current + 1)}
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
