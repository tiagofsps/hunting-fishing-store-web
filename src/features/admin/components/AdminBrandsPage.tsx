import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getBrands } from '../../../lib/catalogApi';
import { createBrand, updateBrand, deleteBrand, type AdminBrandPayload } from '../api';
import { adminBrandSchema, type AdminBrandFormData } from '../validation';
import type { Brand } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

const fieldClass = 'mb-1 block text-xs font-bold text-ink';

function toPayload(data: AdminBrandFormData): AdminBrandPayload {
  return {
    name: data.name,
    slug: data.slug,
    ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
  };
}

export default function AdminBrandsPage() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const form = useForm<AdminBrandFormData>({
    resolver: zodResolver(adminBrandSchema),
    defaultValues: { name: '', slug: '', logoUrl: '' },
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getBrands();
        if (!cancelled) setBrands(data);
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
  }, [reloadToken]);

  const reset = () => {
    setEditingId(null);
    form.reset({ name: '', slug: '', logoUrl: '' });
  };

  const startEdit = (brand: Brand) => {
    setEditingId(brand.id);
    form.reset({ name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl ?? '' });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setError('');
    setIsSaving(true);
    try {
      if (editingId) await updateBrand(editingId, toPayload(data));
      else await createBrand(toPayload(data));
      reset();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setIsSaving(false);
    }
  });

  const handleDelete = async (brand: Brand) => {
    if (!window.confirm(`${t('admin.deleteBrandConfirm')} ${brand.name}`)) return;
    setError('');
    try {
      await deleteBrand(brand.id);
      if (editingId === brand.id) reset();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    }
  };

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.brands')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.newBrand')}</h2>
      </header>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={fieldClass}>{t('admin.productName')}</label>
            <input type="text" {...form.register('name')} className={inputClass} />
          </div>
          <div>
            <label className={fieldClass}>{t('admin.productSlug')}</label>
            <input type="text" {...form.register('slug')} className={inputClass} />
            {form.formState.errors.slug && (
              <p className="mt-1 text-[11px] font-bold text-sale">{t('admin.slugInvalid')}</p>
            )}
          </div>
        </div>
        <div>
          <label className={fieldClass}>{t('admin.logoUrl')}</label>
          <input type="text" {...form.register('logoUrl')} className={inputClass} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
          >
            {isSaving ? t('admin.saving') : editingId ? t('admin.save') : t('admin.newBrand')}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-border bg-surface px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink"
            >
              {t('admin.cancel')}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[480px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.productName')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.productSlug')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.logoUrl')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('admin.edit')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center font-bold text-muted">
                  {t('shop.emptyTitle')}
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3 font-bold text-ink">{brand.name}</td>
                  <td className="px-5 py-3 text-muted">{brand.slug}</td>
                  <td className="max-w-[16rem] truncate px-5 py-3 text-muted">{brand.logoUrl ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(brand)}
                        className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => void handleDelete(brand)}
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
    </div>
  );
}
