import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import type { AdminProductFormData } from '../validation';

interface ProductBasicsSectionProps {
  form: UseFormReturn<AdminProductFormData>;
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  requiresLicense: boolean;
}

/** Names, slug, category and brand, descriptions in both languages, and the licence requirement. */
export function ProductBasicsSection({ form, categories, brands, requiresLicense }: ProductBasicsSectionProps) {
  const { t } = useLanguage();
  const id = useId();
  const { errors } = form.formState;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface-raised p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${id}-name`}>{t('admin.nameEn')}</Label>
          <Input id={`${id}-name`} type="text" {...form.register('name')} />
          {errors.name && <p className="mt-1 text-[11px] font-bold text-sale">{t('admin.errorTitle')}</p>}
        </div>
        <div>
          <Label htmlFor={`${id}-namePt`}>{t('admin.namePt')}</Label>
          <Input id={`${id}-namePt`} type="text" {...form.register('namePt')} />
        </div>
        <div>
          <Label htmlFor={`${id}-slug`}>{t('admin.productSlug')}</Label>
          <Input id={`${id}-slug`} type="text" {...form.register('slug')} />
          {errors.slug && (
            <p className="mt-1 text-[11px] font-bold text-sale">
              {errors.slug.message === 'slugInvalid' ? t('admin.slugInvalid') : t('admin.errorTitle')}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-category`}>{t('admin.productCategory')}</Label>
          <Select id={`${id}-category`} {...form.register('categoryId', { valueAsNumber: true })}>
            <option value={0}>{t('admin.selectPlaceholder')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${id}-brand`}>{t('admin.productBrand')}</Label>
          <Select id={`${id}-brand`} {...form.register('brandId', { valueAsNumber: true })}>
            <option value={0}>{t('admin.selectPlaceholder')}</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-description`}>{t('admin.descriptionEn')}</Label>
          <Textarea id={`${id}-description`} rows={4} {...form.register('description')} />
        </div>
        <div>
          <Label htmlFor={`${id}-descriptionPt`}>{t('admin.descriptionPt')}</Label>
          <Textarea id={`${id}-descriptionPt`} rows={4} {...form.register('descriptionPt')} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input type="checkbox" {...form.register('requiresLicense')} className="h-4 w-4 accent-accent-strong" />
          {t('admin.requiresLicense')}
        </label>
        {requiresLicense && (
          <Select
            aria-label={t('admin.licenseType')}
            {...form.register('licenseType')}
            className="max-w-[12rem]"
          >
            <option value="">{t('admin.selectPlaceholder')}</option>
            <option value="HUNTING">{t('admin.licenseHunting')}</option>
            <option value="FISHING">{t('admin.licenseFishing')}</option>
          </Select>
        )}
        {errors.licenseType && <p className="text-[11px] font-bold text-sale">{t('admin.licenseTypeRequired')}</p>}
      </div>
    </section>
  );
}
