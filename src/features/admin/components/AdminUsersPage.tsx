import { useEffect, useState } from 'react';
import { listUsers } from '../api';
import type { UserResponse } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listUsers(page, PAGE_SIZE);
        if (cancelled) return;
        setUsers(data.content);
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
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.users')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.usersTitle')}</h2>
        <p className="mt-1 text-xs text-muted">{t('admin.usersSubtitle')}</p>
      </header>

      <p className="mt-6 rounded-xl border border-border bg-surface-raised p-3 text-xs text-muted">
        {t('admin.usersReadOnlyNote')}
      </p>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.email')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.productName')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.phone')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.role')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.addressType')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('admin.noUsers')}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3 font-bold text-ink">{user.email}</td>
                  <td className="px-5 py-3 text-muted">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-5 py-3 text-muted">{user.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        user.role === 'ADMIN'
                          ? 'bg-accent-strong text-ink'
                          : 'bg-accent/20 text-accent-strong'
                      }`}
                    >
                      {user.role === 'ADMIN' ? t('admin.roleAdmin') : t('admin.roleUser')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{user.addresses.length}</td>
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
