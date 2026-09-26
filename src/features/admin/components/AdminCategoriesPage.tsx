import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getCategories } from '../../../lib/catalogApi';
import { createCategory, updateCategory, deleteCategory, type AdminCategoryPayload } from '../api';
import { adminCategorySchema, type AdminCategoryFormData } from '../validation';
import type { Category } from '../../../types';
import { useLanguage } from '../../../i18n/useLanguage';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

const fieldClass = 'mb-1 block text-xs font-bold text-ink';

function toPayload(data: AdminCategoryFormData): AdminCategoryPayload {
  return {
    name: data.name,
    slug: data.slug,
    ...(data.description ? { description: data.description } : {}),
    ...(data.parentCategoryId ? { parentCategoryId: data.parentCategoryId } : {}),
  };
}

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const form = useForm<AdminCategoryFormData>({
    resolver: zodResolver(adminCategorySchema),
    defaultValues: { name: '', slug: '', description: '', parentCategoryId: undefined },
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        if (!cancelled) setCategories(data);
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
    form.reset({ name: '', slug: '', description: '', parentCategoryId: undefined });
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentCategoryId: category.parentCategoryId ?? undefined,
    });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setError('');
    setIsSaving(true);
    try {
      if (editingId) await updateCategory(editingId, toPayload(data));
      else await createCategory(toPayload(data));
      reset();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setIsSaving(false);
    }
  });

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`${t('admin.deleteCategoryConfirm')} ${category.name}`)) return;
    setError('');
    try {
      await deleteCategory(category.id);
      if (editingId === category.id) reset();
      setReloadToken((token) => token + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    }
  };

  const parentName = (id?: number) => categories.find((category) => category.id === id)?.name;

  return (
    <div>
      <header className="border-b border-border pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-strong">{t('admin.categories')}</span>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">{t('admin.newCategory')}</h2>
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
          <label className={fieldClass}>{t('admin.productDescription')}</label>
          <textarea rows={2} {...form.register('description')} className={inputClass} />
        </div>
        <div>
          <label className={fieldClass}>{t('admin.parentCategory')}</label>
          <select
            {...form.register('parentCategoryId', { valueAsNumber: true })}
            className={inputClass}
          >
            <option value={Number.NaN}>{t('admin.noParent')}</option>
            {categories
              .filter((category) => category.id !== editingId)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-ink/90 disabled:opacity-50"
          >
            {isSaving ? t('admin.saving') : editingId ? t('admin.save') : t('admin.newCategory')}
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
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="px-5 py-3 font-bold">{t('admin.productName')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.productSlug')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.parentCategory')}</th>
              <th className="px-5 py-3 font-bold">{t('admin.productsCount')}</th>
              <th className="px-5 py-3 text-right font-bold">{t('admin.edit')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-bold text-muted">
                  {t('shop.emptyTitle')}
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-surface-hover">
                  <td className="px-5 py-3 font-bold text-ink">{category.name}</td>
                  <td className="px-5 py-3 text-muted">{category.slug}</td>
                  <td className="px-5 py-3 text-muted">{parentName(category.parentCategoryId ?? undefined) ?? '—'}</td>
                  <td className="px-5 py-3 text-muted">{category.productCount ?? 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(category)}
                        className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink hover:bg-surface"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => void handleDelete(category)}
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
