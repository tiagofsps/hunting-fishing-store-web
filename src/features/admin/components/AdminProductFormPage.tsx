import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router';
import { adminProductSchema, type AdminProductFormData } from '../validation';
import { createProduct, updateProduct, toAdminProductPayload } from '../api';
import { parseAttributes, formatAttributes } from '../utils';
import { getProductById, getCategories, getBrands } from '../../../lib/catalogApi';
import { useLanguage } from '../../../i18n/useLanguage';
import { useAdminError } from '../hooks';
import { ProductBasicsSection } from './ProductBasicsSection';
import { ProductItemsSection } from './ProductItemsSection';
import { ProductImagesSection } from './ProductImagesSection';

const EMPTY_ITEM = { sku: '', price: 0, stockQuantity: 0, weight: undefined, active: true, attributes: undefined };

/**
 * Create/edit product page. The container loads reference data and the product,
 * owns the submit flow and the raw attribute text, and renders the three sections.
 */
export default function AdminProductFormPage() {
  const { t } = useLanguage();
  const describeError = useAdminError();
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
      namePt: '',
      slug: '',
      description: '',
      descriptionPt: '',
      requiresLicense: false,
      licenseType: undefined,
      categoryId: 0,
      brandId: 0,
      items: [{ ...EMPTY_ITEM }],
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
          const english = product.translations?.en;
          const portuguese = product.translations?.pt;
          form.reset({
            name: english?.name ?? product.name,
            namePt: portuguese?.name ?? '',
            slug: product.slug ?? '',
            description: english?.description ?? product.description ?? '',
            descriptionPt: portuguese?.description ?? '',
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
          setRawAttributes((product.items ?? []).map((item) => formatAttributes(item.attributes)));
        }
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isEditing, form, describeError]);

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
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  });

  const setRawAttribute = (index: number, value: string) =>
    setRawAttributes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

  const addItem = () => {
    itemsField.append({ ...EMPTY_ITEM });
    setRawAttributes((prev) => [...prev, '']);
  };

  const removeItem = (index: number) => {
    itemsField.remove(index);
    setRawAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const addImage = () =>
    imagesField.append({ imageUrl: '', altText: '', isPrimary: false, displayOrder: imagesField.fields.length });

  if (loading) {
    return <p className="py-20 text-center text-xs font-bold text-muted">{t('common.loading')}</p>;
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
        <ProductBasicsSection
          form={form}
          categories={categories}
          brands={brands}
          requiresLicense={requiresLicense}
        />

        <ProductItemsSection
          form={form}
          fields={itemsField.fields}
          rawAttributes={rawAttributes}
          onRawAttributesChange={setRawAttribute}
          onAddItem={addItem}
          onRemoveItem={removeItem}
        />

        <ProductImagesSection
          form={form}
          fields={imagesField.fields}
          onAddImage={addImage}
          onRemoveImage={(index) => imagesField.remove(index)}
        />

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
