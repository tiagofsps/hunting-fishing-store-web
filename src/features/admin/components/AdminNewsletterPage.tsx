import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  deleteSubscription,
  exportSubscriptionsCsv,
  getNewsletterStats,
  listSubscriptions,
  updateSubscriptionStatus,
  type NewsletterSubscription,
} from '../api';
import { useLanguage } from '../../../i18n/useLanguage';
import { useAdminError } from '../hooks';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminNewsletterPage() {
  const { t } = useLanguage();
  const describeError = useAdminError();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
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
        const active = statusFilter === 'all' ? undefined : statusFilter === 'active';
        const data = await listSubscriptions(page, PAGE_SIZE, {
          active,
          q: appliedQuery || undefined,
        });
        if (cancelled) return;
        setSubscriptions(data.content);
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
  }, [page, statusFilter, appliedQuery, reloadToken, describeError]);

  useEffect(() => {
    let cancelled = false;
    getNewsletterStats()
      .then((stats) => {
        if (!cancelled) setActiveCount(stats.active);
      })
      .catch(() => {
        // The count is non-critical; the table still renders.
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refresh = () => {
    setReloadToken((token) => token + 1);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setAppliedQuery(searchInput.trim());
  };

  const changeFilter = (filter: StatusFilter) => {
    setPage(0);
    setStatusFilter(filter);
  };

  const handleUnsubscribe = async (subscription: NewsletterSubscription) => {
    if (!window.confirm(`${t('admin.unsubscribeConfirm')} ${subscription.email}`)) return;
    setError('');
    setNotice('');
    try {
      await updateSubscriptionStatus(subscription.id, false);
      setNotice(t('admin.newsletterUpdated'));
      refresh();
    } catch (err) {
      setError(describeError(err));
    }
  };

  const handleResubscribe = async (subscription: NewsletterSubscription) => {
    if (!window.confirm(`${t('admin.resubscribeConfirm')} ${subscription.email}`)) return;
    setError('');
    setNotice('');
    try {
      await updateSubscriptionStatus(subscription.id, true);
      setNotice(t('admin.newsletterUpdated'));
      refresh();
    } catch (err) {
      setError(describeError(err));
    }
  };

  const handleDelete = async (subscription: NewsletterSubscription) => {
    if (!window.confirm(`${t('admin.deleteSubscriptionConfirm')} ${subscription.email}`)) return;
    setError('');
    setNotice('');
    try {
      await deleteSubscription(subscription.id);
      setNotice(t('admin.newsletterDeleted'));
      refresh();
    } catch (err) {
      setError(describeError(err));
    }
  };

  const handleExport = async () => {
    setError('');
    setNotice('');
    try {
      const csv = await exportSubscriptionsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'newsletter-subscriptions.csv';
      link.click();
      URL.revokeObjectURL(url);
      setNotice(t('admin.newsletterExported'));
    } catch (err) {
      setError(describeError(err));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterButtonClass = (filter: StatusFilter) =>
    `rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
      statusFilter === filter ? 'bg-ink text-white' : 'text-muted hover:bg-surface-hover hover:text-ink'
    }`;

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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-xs font-bold text-muted">
          {t('admin.activeSubscribers')}: <span className="text-ink">{activeCount ?? '—'}</span>
        </div>

        <form onSubmit={submitSearch} className="flex h-10 flex-1 items-center gap-2 rounded-full border border-border bg-surface-raised px-4 text-muted focus-within:border-accent-border">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('admin.searchSubscriptions')}
            className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-placeholder"
          />
        </form>

        <div className="flex items-center gap-1 rounded-full border border-border bg-surface-raised p-1">
          <button type="button" onClick={() => changeFilter('all')} className={filterButtonClass('all')}>
            {t('admin.allSubscriptions')}
          </button>
          <button type="button" onClick={() => changeFilter('active')} className={filterButtonClass('active')}>
            {t('admin.activeSubscriptions')}
          </button>
          <button type="button" onClick={() => changeFilter('inactive')} className={filterButtonClass('inactive')}>
            {t('admin.inactiveSubscriptions')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleExport()}
          className="rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface-hover"
        >
          {t('admin.exportCsv')}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.email')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.subscribedAt')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.active')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('admin.actions')}</th>
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
                      {subscription.active ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {subscription.active ? (
                        <button
                          onClick={() => void handleUnsubscribe(subscription)}
                          className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface"
                        >
                          {t('admin.unsubscribe')}
                        </button>
                      ) : (
                        <button
                          onClick={() => void handleResubscribe(subscription)}
                          className="rounded-lg border border-accent-border bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-strong hover:bg-accent/20"
                        >
                          {t('admin.resubscribe')}
                        </button>
                      )}
                      <button
                        onClick={() => void handleDelete(subscription)}
                        className="rounded-lg border border-sale/40 bg-sale/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sale hover:bg-sale/20"
                      >
                        {t('admin.deleteSubscription')}
                      </button>
                    </div>
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
