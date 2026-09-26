import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getProductsPage } from '../../../lib/catalogApi';
import { deleteProduct } from '../api';
import { formatCurrency, getProductImageUrl } from '../../../utils';
import type { Product } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const page = Number(searchParams.get('page') ?? '0');
  const query = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getProductsPage({ page, size: PAGE_SIZE, q: query || undefined });
        if (!cancelled) {
          setProducts(data.content);
          setTotal(data.totalElements);
        }
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
  }, [page, query, reloadToken]);

  const updateParams = (next: Record<string, string>) => {
    setSearchParams(next);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateParams({ q: searchInput, page: '0' });
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(t('admin.deleteProductConfirm'))) return;
    try {
      await deleteProduct(product.id);
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.products')}</span>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.productsTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('admin.productsSubtitle')}</p>
        </div>
        <Link
          to="/admin/products/new"
          className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90"
        >
          {t('admin.newProduct')}
        </Link>
      </header>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('admin.searchProducts')}
          className="w-full rounded-xl bg-surface-raised px-4 py-3 text-xs font-medium text-ink border border-border outline-none focus:border-accent-strong"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-accent-strong px-5 py-3 text-xs font-bold uppercase tracking-wider text-ink"
        >
          {t('admin.search')}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.productName')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.sku')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.price')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.stock')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('admin.editProduct')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('shop.emptyTitle')}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{product.name}</p>
                        <p className="truncate text-[10px] text-muted">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{(product.items ?? []).map((item) => item.sku).join(', ')}</td>
                  <td className="px-5 py-3 font-bold text-ink">
                    {(product.items ?? []).length > 0 ? formatCurrency((product.items ?? [])[0].price) : '—'}
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {(product.items ?? []).reduce((sum, item) => sum + item.stockQuantity, 0)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface"
                      >
                        {t('admin.edit')}
                      </Link>
                      <button
                        onClick={() => void handleDelete(product)}
                        className="rounded-lg border border-sale/40 bg-sale/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sale hover:bg-sale/20"
                      >
                        {t('admin.deleteProduct')}
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
              onClick={() => updateParams({ ...(query ? { q: query } : {}), page: String(page - 1) })}
              className="rounded-lg border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink disabled:opacity-40"
            >
              ← {t('shop.previous')}
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => updateParams({ ...(query ? { q: query } : {}), page: String(page + 1) })}
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
