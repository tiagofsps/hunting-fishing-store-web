import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import type { AdminProductFormData } from '../validation';

interface ProductImagesSectionProps {
  form: UseFormReturn<AdminProductFormData>;
  /** Field-array rows from react-hook-form; `id` is the stable React key. */
  fields: { id: string }[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}

/** Product gallery rows: URL, alt text, display order and the primary flag. */
export function ProductImagesSection({ form, fields, onAddImage, onRemoveImage }: ProductImagesSectionProps) {
  const { t } = useLanguage();
  const id = useId();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t('admin.productImages')}</h3>
        <button
          type="button"
          onClick={onAddImage}
          className="rounded-lg border border-accent-border bg-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-strong"
        >
          {t('admin.addImage')}
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface-raised p-6 text-center text-xs font-bold text-muted">
          {t('admin.productImages')}
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const rowId = `${id}-image-${index}`;
            return (
              <li key={field.id} className="grid gap-4 rounded-2xl border border-border bg-surface-raised p-5 sm:grid-cols-4">
                <div>
                  <Label htmlFor={`${rowId}-url`}>{t('admin.imageUrl')}</Label>
                  <Input id={`${rowId}-url`} type="text" {...form.register(`images.${index}.imageUrl`)} />
                </div>
                <div>
                  <Label htmlFor={`${rowId}-alt`}>{t('admin.imageAlt')}</Label>
                  <Input id={`${rowId}-alt`} type="text" {...form.register(`images.${index}.altText`)} />
                </div>
                <div>
                  <Label htmlFor={`${rowId}-order`}>{t('admin.displayOrder')}</Label>
                  <Input
                    id={`${rowId}-order`}
                    type="number"
                    {...form.register(`images.${index}.displayOrder`, { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-ink">
                    <input type="checkbox" {...form.register(`images.${index}.isPrimary`)} className="h-4 w-4 accent-accent-strong" />
                    {t('admin.isPrimary')}
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="rounded-lg border border-sale/40 bg-sale/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-sale"
                  >
                    {t('admin.removeRow')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
