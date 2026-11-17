import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useLanguage } from '../../../i18n/useLanguage';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import type { AdminProductFormData } from '../validation';
import { toOptionalNumber } from '../utils';

interface ProductItemsSectionProps {
  form: UseFormReturn<AdminProductFormData>;
  /** Field-array rows from react-hook-form; `id` is the stable React key. */
  fields: { id: string }[];
  rawAttributes: string[];
  onRawAttributesChange: (index: number, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

/** Purchasable variants: SKU, price, stock, weight, attributes and active flag. */
export function ProductItemsSection({
  form,
  fields,
  rawAttributes,
  onRawAttributesChange,
  onAddItem,
  onRemoveItem,
}: ProductItemsSectionProps) {
  const { t } = useLanguage();
  const id = useId();
  const { errors } = form.formState;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{t('admin.productItems')}</h3>
        <button
          type="button"
          onClick={onAddItem}
          className="rounded-lg border border-accent-border bg-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-strong"
        >
          {t('admin.addItem')}
        </button>
      </div>

      {errors.items?.message && <p className="text-[11px] font-bold text-sale">{t('admin.needAtLeastOneItem')}</p>}

      <ul className="space-y-3">
        {fields.map((field, index) => {
          const rowId = `${id}-item-${index}`;
          const rowErrors = errors.items?.[index];
          const invalid = <p className="mt-1 text-[11px] font-bold text-sale">{t('admin.errorTitle')}</p>;
          return (
            <li key={field.id} className="rounded-2xl border border-border bg-surface-raised p-5">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <Label htmlFor={`${rowId}-sku`}>{t('admin.sku')}</Label>
                  <Input id={`${rowId}-sku`} type="text" {...form.register(`items.${index}.sku`)} />
                  {rowErrors?.sku && invalid}
                </div>
                <div>
                  <Label htmlFor={`${rowId}-price`}>{t('admin.price')}</Label>
                  <Input
                    id={`${rowId}-price`}
                    type="number"
                    step="0.01"
                    {...form.register(`items.${index}.price`, { valueAsNumber: true })}
                  />
                  {rowErrors?.price && invalid}
                </div>
                <div>
                  <Label htmlFor={`${rowId}-stock`}>{t('admin.stock')}</Label>
                  <Input
                    id={`${rowId}-stock`}
                    type="number"
                    {...form.register(`items.${index}.stockQuantity`, { valueAsNumber: true })}
                  />
                  {rowErrors?.stockQuantity && invalid}
                </div>
                <div>
                  <Label htmlFor={`${rowId}-weight`}>{t('admin.weight')}</Label>
                  <Input
                    id={`${rowId}-weight`}
                    type="number"
                    step="0.01"
                    {...form.register(`items.${index}.weight`, { setValueAs: toOptionalNumber })}
                  />
                  {rowErrors?.weight && invalid}
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`${rowId}-attributes`}>{t('admin.attributes')}</Label>
                  <Input
                    id={`${rowId}-attributes`}
                    type="text"
                    value={rawAttributes[index] ?? ''}
                    onChange={(event) => onRawAttributesChange(index, event.target.value)}
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-ink">
                    <input type="checkbox" {...form.register(`items.${index}.active`)} className="h-4 w-4 accent-accent-strong" />
                    {t('admin.active')}
                  </label>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="rounded-lg border border-sale/40 bg-sale/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-sale"
                    >
                      {t('admin.removeRow')}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
