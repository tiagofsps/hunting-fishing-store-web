import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router';
import { adminProductSchema, type AdminProductFormData } from '../validation';
import { createProduct, updateProduct, toAdminProductPayload } from '../api';
import { getProductById, getCategories, getBrands } from '../../../lib/catalogApi';
import { useLanguage } from '../../../i18n/useLanguage';

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-xs border border-border outline-none focus:border-accent-strong text-ink font-medium';

const fieldClass = 'mb-1 block text-xs font-bold text-ink';

function parseAttributes(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const entries = raw
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [key, ...rest] = pair.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
    .filter(([key, value]) => key.length > 0 && value.length > 0);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export default function AdminProductFormPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id !== undefined;

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [rawAttributes, setRawAttributes] = useState<string[]>([]);

  const form = useForm<AdminProductFormData>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      requiresLicense: false,
      licenseType: undefined,
      categoryId: 0,
      brandId: 0,
      items: [{ sku: '', price: 0, stockQuantity: 0, weight: undefined, active: true, attributes: undefined }],
      images: [],
    },
  });

  const requiresLicense = useWatch({ control: form.control, name: 'requiresLicense' });
  const itemsField = useFieldArray({ control: form.control, name: 'items' });
  const imagesField = useFieldArray({ control: form.control, name: 'images' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [cats, brs] = await Promise.all([getCategories(), getBrands()]);
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);

        if (isEditing) {
          const product = await getProductById(Number(id));
          if (cancelled) return;
          form.reset({
            name: product.name,
            slug: product.slug ?? '',
            description: product.description ?? '',
            requiresLicense: product.requiresLicense ?? false,
            licenseType: product.licenseType,
            categoryId: product.categoryId ?? 0,
            brandId: product.brandId ?? 0,
            items: (product.items ?? []).map((item) => ({
              sku: item.sku ?? '',
              price: item.price,
              stockQuantity: item.stockQuantity,
              weight: item.weight ?? undefined,
              active: item.active ?? true,
              attributes: item.attributes
                ? Object.fromEntries(
                    Object.entries(item.attributes).map(([key, value]) => [key, String(value)])
                  )
                : undefined,
            })),
            images: (product.images ?? []).map((image) => ({
              imageUrl: image.imageUrl,
              altText: image.altText,
              isPrimary: image.isPrimary ?? false,
              displayOrder: image.displayOrder ?? 0,
            })),
          });
          setRawAttributes(
            (product.items ?? []).map((item) =>
              item.attributes
                ? Object.entries(item.attributes)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(', ')
                : ''
            )
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isEditing, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setError('');
    setSaved(false);
    setIsSaving(true);
    try {
      const payload = toAdminProductPayload({
        ...data,
        items: data.items.map((item, index) => ({
          ...item,
          attributes: parseAttributes(rawAttributes[index]),
        })),
      });
      if (isEditing) await updateProduct(Number(id), payload);
      else await createProduct(payload);
      setSaved(true);
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setIsSaving(false);
    }
  });

  const errors = form.formState.errors;

  if (loading) {
    return (
      <p className="py-20 text-center text-xs font-bold text-muted">{t('common.loading')}</p>
    );
  }

  return (
    <div>
      <header className="border-b border-border pb-6">
        <Link to="/admin/products" className="text-xs font-bold uppercase tracking-wider text-muted hover:text-ink">
          ← {t('admin.products')}
        </Link>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">
          {isEditing ? t('admin.editProduct') : t('admin.newProduct')}
        </h2>
      </header>

      {error && (
        <p className="mt-6 rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs font-bold text-sale">
          {t('admin.errorTitle')} {error}
        </p>
      )}
      {saved && (
        <p className="mt-6 rounded-xl border border-accent-border bg-accent/10 p-3 text-xs font-bold text-accent-strong">
          {t('admin.productSaved')}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Basics */}
        <section className="space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldClass}>{t('admin.productName')}</label>
              <input type="text" {...form.register('name')} className={inputClass} />
              {errors.name && <p className="mt-1 text-[11px] font-bold text-sale">{t('admin.errorTitle')}</p>}
            </div>
            <div>
              <label className={fieldClass}>{t('admin.productSlug')}</label>
              <input type="text" {...form.register('slug')} className={inputClass} />
              {errors.slug && (
                <p className="mt-1 text-[11px] font-bold text-sale">
                  {errors.slug.message === 'slugInvalid' ? t('admin.slugInvalid') : t('admin.errorTitle')}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldClass}>{t('admin.productCategory')}</label>
              <select {...form.register('categoryId', { valueAsNumber: true })} className={inputClass}>
                <option value={0}>{t('admin.selectPlaceholder')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldClass}>{t('admin.productBrand')}</label>
              <select {...form.register('brandId', { valueAsNumber: true })} className={inputClass}>
                <option value={0}>{t('admin.selectPlaceholder')}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldClass}>{t('admin.productDescription')}</label>
            <textarea rows={4} {...form.register('description')} className={inputClass} />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-bold text-ink">
              <input type="checkbox" {...form.register('requiresLicense')} className="h-4 w-4 accent-accent-strong" />
              {t('admin.requiresLicense')}
            </label>
            {requiresLicense && (
              <select {...form.register('licenseType')} className={`${inputClass} max-w-[12rem]`}>
                <option value="">{t('admin.selectPlaceholder')}</option>
                <option value="HUNTING">{t('admin.licenseHunting')}</option>
                <option value="FISHING">{t('admin.licenseFishing')}</option>
              </select>
            )}
            {errors.licenseType && (
              <p className="text-[11px] font-bold text-sale">{t('admin.licenseTypeRequired')}</p>
            )}
          </div>
        </section>

        {/* Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t('admin.productItems')}</h3>
            <button
              type="button"
              onClick={() => {
                itemsField.append({ sku: '', price: 0, stockQuantity: 0, weight: undefined, active: true, attributes: undefined });
                setRawAttributes((prev) => [...prev, '']);
              }}
              className="rounded-lg border border-accent-border bg-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-strong"
            >
              {t('admin.addItem')}
            </button>
          </div>

          {errors.items?.message && <p className="text-[11px] font-bold text-sale">{t('admin.needAtLeastOneItem')}</p>}

          <ul className="space-y-3">
            {itemsField.fields.map((field, index) => (
              <li key={field.id} className="rounded-2xl border border-border bg-surface-raised p-5">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className={fieldClass}>{t('admin.sku')}</label>
                    <input type="text" {...form.register(`items.${index}.sku`)} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldClass}>{t('admin.price')}</label>
                    <input type="number" step="0.01" {...form.register(`items.${index}.price`, { valueAsNumber: true })} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldClass}>{t('admin.stock')}</label>
                    <input type="number" {...form.register(`items.${index}.stockQuantity`, { valueAsNumber: true })} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldClass}>{t('admin.weight')}</label>
                    <input type="number" step="0.01" {...form.register(`items.${index}.weight`, { valueAsNumber: true })} className={inputClass} />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldClass}>{t('admin.attributes')}</label>
                    <input
                      type="text"
                      value={rawAttributes[index] ?? ''}
                      onChange={(event) =>
                        setRawAttributes((prev) => {
                          const next = [...prev];
                          next[index] = event.target.value;
                          return next;
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-ink">
                      <input
                        type="checkbox"
                        {...form.register(`items.${index}.active`)}
                        className="h-4 w-4 accent-accent-strong"
                      />
                      {t('admin.active')}
                    </label>
                    {itemsField.fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          itemsField.remove(index);
                          setRawAttributes((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="rounded-lg border border-sale/40 bg-sale/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-sale"
                      >
                        {t('admin.removeRow')}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Images */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t('admin.productImages')}</h3>
            <button
              type="button"
              onClick={() => imagesField.append({ imageUrl: '', altText: '', isPrimary: false, displayOrder: imagesField.fields.length })}
              className="rounded-lg border border-accent-border bg-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-strong"
            >
              {t('admin.addImage')}
            </button>
          </div>

          {imagesField.fields.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface-raised p-6 text-center text-xs font-bold text-muted">
              {t('admin.productImages')}
            </p>
          ) : (
            <ul className="space-y-3">
              {imagesField.fields.map((field, index) => (
                <li key={field.id} className="grid gap-4 rounded-2xl border border-border bg-surface-raised p-5 sm:grid-cols-4">
                  <div>
                    <label className={fieldClass}>{t('admin.imageUrl')}</label>
                    <input type="text" {...form.register(`images.${index}.imageUrl`)} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldClass}>{t('admin.imageAlt')}</label>
                    <input type="text" {...form.register(`images.${index}.altText`)} className={inputClass} />
                  </div>
                  <div>
                    <label className={fieldClass}>{t('admin.displayOrder')}</label>
                    <input type="number" {...form.register(`images.${index}.displayOrder`, { valueAsNumber: true })} className={inputClass} />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-ink">
                      <input
                        type="checkbox"
                        {...form.register(`images.${index}.isPrimary`)}
                        className="h-4 w-4 accent-accent-strong"
                      />
                      {t('admin.isPrimary')}
                    </label>
                    <button
                      type="button"
                      onClick={() => imagesField.remove(index)}
                      className="rounded-lg border border-sale/40 bg-sale/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-sale"
                    >
                      {t('admin.removeRow')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-ink px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-ink/90 disabled:opacity-50"
        >
          {isSaving ? t('admin.saving') : isEditing ? t('admin.updateProduct') : t('admin.createProduct')}
        </button>
      </form>
    </div>
  );
}
